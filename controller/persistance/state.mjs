import crypto from "crypto";
import axios from "axios";
import { Mutex } from "async-mutex";

("use strict");

class State {
    constructor() {
        this.clusters = [];
        this.clustersMutex = new Mutex();

        this.workers = [];
        this.workersMutex = new Mutex();

        this.routines = [];
        this.routinesMutex = new Mutex();

        this.incidents = [];
        this.incidentsMutex = new Mutex();

        this.routineLoopRunning = false;
        this.incidentsFetchLoopRunning = false;
        this.testAliveLoopRunning = false;
    }

    getWorkers() {
        return this.workers;
    }

    getAdapters() {
        return this.clusters;
    }

    getRoutines() {
        return this.routines;
    }

    getIncidents() {
        return this.incidents;
    }

    // thread safe
    async addAdapter(hostName, port) {
        const release = await this.clustersMutex.acquire();

        // outer try catch finnaly block is used to release Mutex lock
        try {
            // test if adapter is already in list. throw error
            for (let cluster of this.clusters) {
                for (let adapter of cluster.adapters) {
                    if (
                        adapter.hostName === hostName &&
                        adapter.port === port
                    ) {
                        throw new Error(
                            "adapter with given hostname and port is already registered"
                        );
                    }
                }
            }

            // try getting identifier from adapter. throw error if failed
            try {
                var responseIdentifier = await axios.get(
                    `http://${hostName}:${port}/api/identifier`
                );
            } catch (err) {
                throw new Error("adapter is not availible");
            }

            let identifier = responseIdentifier.data;
            let adapter = new Adapter(hostName, port, identifier);
            let cluster = this.clusters.find(
                (cluster) => cluster.identifier === identifier
            );

            // if cluster exists then just push adapter to it
            if (cluster) {
                cluster.adapters.push(adapter);
                // if not, create new cluster and add adapter to it
            } else {
                let cluster;
                let responseHosts;
                let responseDials;
                try {
                    responseHosts = await axios.get(
                        `http://${hostName}:${port}/api/hosts`
                    );
                    responseDials = await axios.get(
                        `http://${hostName}:${port}/api/dials`
                    );

                    cluster = new Cluster(
                        identifier,
                        responseDials.data,
                        responseHosts.data,
                        [adapter]
                    );

                    this.clusters.push(cluster);
                } catch (err) {
                    throw new Error("invalid data fetched from adapter");
                }
            }
        } catch (err) {
            throw err;
        } finally {
            release();
        }
    }

    // thread safe
    async addWorker(hostName, port) {
        const release = await this.workersMutex.acquire();

        try {
            // try to find worker in list of already registered. throw error if found
            this.workers.find((worker) => {
                if (worker.hostName === hostName && worker.port === port) {
                    throw new Error(
                        "worker with given hostname and port is already registered"
                    );
                }
            });

            try {
                var response = await axios.get(
                    `http://${hostName}:${port}/api/identifier/`
                );
            } catch (err) {
                throw new Error("worker is not availible");
            }

            let worker = new Worker(
                hostName,
                port,
                response.data,
                response.data
            );

            this.workers.push(worker);
        } catch (err) {
            throw err;
        } finally {
            release();
        }
    }

    async addRoutine(
        clusterIdentifier,
        workerHostName,
        workerPort,
        dialNames,
        clusterHostName
    ) {
        // need to acquire multiple locks because routine needs to test if they exist before registering
        const releaseRoutines = await this.routinesMutex.acquire();
        const releaseAdapters = await this.clustersMutex.acquire();
        const releaseWorkers = await this.workersMutex.acquire();

        try {
            // test if cluster eixists
            let cluster = this.clusters.find(
                (cluster) => cluster.identifier === clusterIdentifier
            );
            if (!cluster) {
                throw new Error("non-existent cluster identifier");
            }

            // test if host is registered in cluster
            let host = cluster.hosts.find(
                (host) => host.HostName === clusterHostName
            );
            if (!host) {
                throw new Error("specified host does not exist");
            }

            // test if worker is registered
            let worker = this.workers.find(
                (worker) =>
                    worker.hostName === workerHostName &&
                    worker.port === workerPort
            );
            if (!worker) {
                throw new Error("worker has not been registered");
            }

            let dials = [];
            // iterate through dials and then add them if they are a part of a cluster. if not abort
            for (let dialName of dialNames) {
                let dial = cluster.dials.find((dial) => dialName === dial.Name);

                if (!dial) {
                    throw new Error(
                        `dial ${dialName} is not supported by the cluster`
                    );
                }

                dials.push(dial);
            }

            if (!dials) {
                throw new Error("no dials to measure");
            }

            // try initiate session
            try {
                var responseCollectStart = await axios({
                    method: "post",
                    url: `http://${worker.hostName}:${worker.port}/api/collect/start/`,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: {
                        HostName: clusterHostName,
                        AdapterIdentifier: clusterIdentifier,
                        Dials: dials,
                    },
                });
            } catch (err) {
                throw new Error("worker is not availible");
            }

            let routine = new Routine(
                clusterIdentifier,
                worker,
                dials,
                responseCollectStart.data
            );

            this.routines.push(routine);
        } catch (err) {
            throw err;
        } finally {
            releaseRoutines();
            releaseAdapters();
            releaseWorkers();
        }
    }

    async startRoutineLoop() {
        if (this.routineLoopRunning) {
            return;
        }

        this.routineLoopRunning = true;

        while (this.routineLoopRunning) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            this.runRoutines();
        }
    }

    stopRoutineLoop() {
        this.routineLoopRunning = false;
    }

    async runRoutines() {
        for (let routine of [...this.routines]) {
            if (!routine.broken) {
                let cluster = this.clusters.find(
                    (cluster) =>
                        cluster.identifier === routine.clusterIdentifier
                );

                let randomAdapter = cluster.adapters.at(
                    Math.floor(Math.random() * cluster.adapters.length)
                );

                // Executing routine
                routine.execute(randomAdapter);
            }
        }
    }

    async startIncidentFetchLoop() {
        if (this.incidentsFetchLoopRunning) {
            return;
        }

        this.incidentsFetchLoopRunning = true;

        while (this.incidentsFetchLoopRunning) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            this.fetchIncidents();
        }
    }

    // thread safe
    async fetchIncidents() {
        const release = await this.incidentsMutex.acquire();
        for (let worker of this.workers) {
            try {
                this.incidents = this.incidents.concat(
                    await worker.fetchIncidents()
                );
            } catch (err) {}
        }

        release();
    }

    async startAliveLoop() {
        if (this.testAliveLoopRunning) {
            return;
        }

        this.testAliveLoopRunning = true;

        while (this.testAliveLoopRunning) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            this.testAliveAll();
        }
    }

    async testAliveAll() {
        const releaseAdapters = await this.clustersMutex.acquire();
        const releaseWorkers = await this.workersMutex.acquire();

        try {
            for (let cluster of this.clusters) {
                for (let adapter of cluster.adapters) {
                    await adapter.testAlive();
                }
            }

            for (let workers of this.workers) {
                await workers.testAlive();
            }
        } catch (err) {
        } finally {
            releaseAdapters();
            releaseWorkers();
        }
    }
}

class Routine {
    constructor(clusterIdentifier, worker, dials, sessionID) {
        this.clusterIdentifier = clusterIdentifier;
        this.worker = worker;
        this.dials = dials;
        this.sessionID = sessionID;
        this.executing = false;
        this.broken = false;
        this.enabled = true;
    }

    async execute(adapter) {
        if (this.executing) {
            return;
        }

        this.executing = true;

        try {
            let response = await this.worker.fetchDataFromAdapter(
                adapter,
                this.sessionID
            );
            this.worker.this.callIfGoodResponse();
            return response;
        } catch (err) {
            // TODO change this behaviour to multiple tries
            if (
                this.worker.badResponseCounter ===
                this.worker.badResponseCounterMax
            ) {
                this.broken = true;
            }
        } finally {
            this.executing = false;
        }
    }
}

class Cluster {
    constructor(identifier, dials, hosts, adapters) {
        this.identifier = identifier;
        this.dials = dials;
        this.hosts = hosts;
        this.adapters = adapters;
    }
}

class Adapter {
    constructor(hostName, port, identifier) {
        this.hostName = hostName;
        this.port = port;
        this.badResponseCounter = 0;
        this.badResponseCounterMax = 5;
        this.dead = false;
        this.identifier = identifier;
    }

    callIfGoodResponse() {
        this.badResponseCounter = 0;
    }

    callIfBadResponse() {
        this.badResponseCounter += 1;

        if (this.badResponseCounter >= this.badResponseCounterMax) {
            this.dead = true;
        }
    }

    async testAlive() {
        try {
            // TODO maybe add check if returned identifier is identical to object's property
            await axios.get(
                `http://${this.hostName}:${this.port}/api/identifier`
            );
            this.callIfGoodResponse();
        } catch (err) {
            this.callIfBadResponse();
        }
    }
}

class Worker {
    constructor(hostName, port, identifier) {
        this.hostName = hostName;
        this.port = port;
        this.badResponseCounter = 0;
        this.badResponseCounterMax = 5;
        this.dead = false;
        this.identifier = identifier;
    }

    callIfGoodResponse() {
        this.badResponseCounter = 0;
    }

    callIfBadResponse() {
        this.badResponseCounter += 1;

        if (this.badResponseCounter >= this.badResponseCounterMax) {
            this.dead = true;
        }
    }

    async fetchDataFromAdapter(adapter, sessionID) {
        try {
            var response = await axios({
                method: "post",
                url: `http://${this.hostName}:${this.port}/api/collect/data/`,
                headers: {
                    "Content-Type": "application/json",
                },
                data: {
                    SessionID: sessionID,
                    AdapterURL: `http://${adapter.hostName}:${adapter.port}/api/measure/`,
                },
            });
            this.callIfGoodResponse();
            return response;
        } catch (err) {
            this.callIfBadResponse();
            adapter.callIfBadResponse();
        }
    }

    async fetchIncidents() {
        try {
            var incidentsResponse = await axios({
                method: "post",
                url: `http://${this.hostName}:${this.port}/api/incidents/`,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            var incidents = incidentsResponse.data;

            this.callIfGoodResponse();
        } catch (err) {
            this.callIfBadResponse();
            throw new Error(
                `failed to get incidents from worker ${this.hostName}:${this.port}`
            );
        }

        return incidents;
    }

    async testAlive() {
        try {
            // TODO maybe add check if returned identifier is identical to object's property
            await axios.get(
                `http://${this.hostName}:${this.port}/api/identifier`
            );
            this.callIfGoodResponse();
        } catch (err) {
            this.callIfBadResponse();
        }
    }
}

export { State };
