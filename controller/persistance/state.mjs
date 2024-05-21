import crypto from "crypto";
import axios from "axios";

import { Mutex } from "async-mutex";
import { pgAdapter } from "./db_adapter.mjs";
import {
    Routine,
    Cluster,
    Adapter,
    Worker
} from "./types.mjs";
import { clearScreenDown } from "readline";

("use strict");

class State {
    constructor() {
        this.DB = new pgAdapter();

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
        this.DBInsertLoopRunning = false;
        this.testAliveLoopRunning = false;
        this.backupLoopRunning = false;
    }

    getWorkers() {
        return this.workers.map(worker => {
            return {
                identifier: worker.identifier,
                hostName: worker.hostName,
                port: worker.port,
                dead: !worker.failureCounter.test(),
            };
        });
    }

    getAdapters() {
        return this.clusters.map(cluster => {
            return {
                identifier: cluster.identifier,
                dials: cluster.dials,
                hosts: cluster.hosts,
                adapters: cluster.adapters.map(adapter => {
                    return {
                        hostName: adapter.hostName,
                        port: adapter.port,
                        identifier: adapter.identifier,
                        dead: !adapter.failureCounter.test(),
                    }
                }),
            };
        });
    }

    getRoutines() {
        return this.routines.map(routine => {
            return {
                clusterIdentifier: routine.clusterIdentifier,
                worker: {
                    identifier: routine.worker.identifier,
                    hostName: routine.worker.hostName,
                    port: routine.worker.port,
                    dead: !routine.worker.failureCounter.test(),
                },
                dials: routine.dials,
                sessionID: routine.sessionID,
                executing: routine.executing,
                broken: !routine.failureCounter.test(),
                enabled: routine.enabled,
            };
        });
    }

    getIncidents(from = null, to = null) {
        try {
            if (from && to) {
                return this.incidents.slice(this.incidents.length - to, this.incidents.length - from);
            }
        } catch { }
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

    // thread safe
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
            if (routine.failureCounter.test()) {
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

    async kickStartRoutine(sessionID) {
        const releaseRoutines = await this.routinesMutex.acquire();
        try {
            var routine = this.routines.find(routine => routine.sessionID === sessionID);

            if (routine) {
                routine.failureCounter.reset();
            }
        } catch {
            throw new Error("kickstart failed");
        }
        finally {
            releaseRoutines();
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
            } catch (err) {
            }
        }

        release();
    }

    async startAliveLoop() {
        if (this.testAliveLoopRunning) {
            return;
        }

        this.testAliveLoopRunning = true;

        while (this.testAliveLoopRunning) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
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

    async startDBInsertLoop() {
        if (this.DBInsertLoopRunning) {
            return;
        }

        this.DBInsertLoopRunning = true;

        while (this.DBInsertLoopRunning) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            this.postIncidentsToDB();
        }
    }

    async postIncidentsToDB() {
        const release = await this.incidentsMutex.acquire();

        try {
            await this.DB.uploadIncidents(this.incidents.slice(0, 1000));
            //this.incidents = this.incidents.slice(1000, this.incidents.length);
        } catch (err) { }

        release();
    }

    async startBackupLoop() {

    }
}

export { State };
