import crypto from 'crypto';
import axios from 'axios';

class State {
    constructor() {
        this.clusters = [];
        this.workers = [];
        this.routines = [];
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

    async addAdapter(hostName, port) {
        // Test if adapter is not already in the list
        for (let cluster of this.clusters) {
            for (let adapter of cluster.adapters) {
                if (adapter.hostName === hostName && adapter.port === port) {
                    throw new Error("adapter with given hostname and port is already registered");
                }
            }
        }

        let responseIdentifier;
        try {
            responseIdentifier = await axios.get(`http://${hostName}:${port}/api/identifier`);
        }
        catch (err) {
            throw new Error('adapter is not availible');
        }

        let identifier = responseIdentifier.data;
        let adapter = new Adapter(hostName, port, identifier);
        let cluster = this.clusters.find(cluster => cluster.identifier === identifier);

        if (cluster) {
            cluster.adapters.push(adapter);
        }
        else {
            let cluster;
            let responseHosts;
            let responseDials;
            try {
                responseHosts = await axios.get(`http://${hostName}:${port}/api/hosts`);
                responseDials = await axios.get(`http://${hostName}:${port}/api/dials`);

                cluster = new Cluster(identifier, responseDials.data, responseHosts.data, [adapter]);

                this.clusters.push(cluster);
            }
            catch (err) {
                throw new Error('invalid data returned from adapter when appending to list');
            }
        }
    }

    async addWorker(hostName, port) {
        this.workers.find(worker => {
            if (worker.hostName === hostName && worker.port === port) {
                throw new Error("worker with given hostname and port is already registered");
            }
        });
        
        let response;
        try {
            response = await axios.get(`http://${hostName}:${port}/api/identifier`);
        }
        catch (err) {
            throw new Error('worker is not availible');
        }

        let worker = new Worker(hostName, port, response.data, response.data);

        this.workers.push(worker);
    }

    async addRoutine(clusterIdentifier, workerHostName, workerPort, dialNames, clusterHostName) {
        let cluster = this.clusters.find(cluster => cluster.identifier === clusterIdentifier);
        if (!cluster) {
            throw new Error('non-existent cluster identifier');
        }

        let host = cluster.hosts.find(host => host.HostName === clusterHostName);
        if (!host) {
            throw new Error('specified host does not exist');
        }

        let worker = this.workers.find(worker => 
            worker.hostName === workerHostName && worker.port === workerPort);
        if (!worker) {
            throw new Error('worker has not been registered');
        }

        let dials = [];
        for (let dialName of dialNames) {
            let dial = cluster.dials.find(dial => dialName === dial.Name);

            if (!dial) {
                throw new Error(`dial ${dialName} is not supported by the cluster`);
            }

            dials.push(dial);
        }

        if (!dials) {
            throw new Error(`no dials to measure`);
        }

        let responseCollectStart;

        console.log(`http://${worker.hostName}:${worker.port}/api/collect/start/`);

        try {
            responseCollectStart = await axios({
                method: 'post',
                url: `http://${worker.hostName}:${worker.port}/api/collect/start/`,
                headers: {
                    'Content-Type': 'application/json'
                }, 
                data: {
                    HostName: clusterHostName,
                    AdapterIdentifier: clusterIdentifier,
                    Dials: dials
                }
            });  
        }
        catch (err) {
            throw new Error('worker is not availible');
        }

        let routine = new Routine(clusterIdentifier, worker, dials, responseCollectStart.data);

        this.routines.push(routine);
    }

    removeAdapter() {

    }

    removeWorker() {
        
    }

    testAliveAll() {

    }
}

class Routine {
    constructor(clusterIdentifier, worker, dials, sessionID) {
        this.clusterIdentifier = clusterIdentifier;
        this.worker = worker;
        this.dials = dials;
        this.sessionID = sessionID;
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
        this.dead = true;
        this.identifier = identifier;
    }

    testAlive() {}
}

class Worker {
    constructor(hostName, port, identifier) {
        this.hostName = hostName;
        this.port = port;
        this.dead = true;
        this.identifier = identifier;
    }

    testAlive() {}
}

export {
    State
}