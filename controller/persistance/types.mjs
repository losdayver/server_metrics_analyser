import axios from "axios";

class FailureCounter {
    #counter;
    #max;

    constructor(max) {
        this.#counter = 0;
        this.#max = max;
    }

    increase() {
        if (this.#counter < this.#max) {
            this.#counter++;
        }
    }

    test() {
        if (this.#counter >= this.#max) {
            return false;
        }
        return true;
    }

    decrease() {
        if (this.#counter > 0) {
            this.#counter--;
        }
    }

    reset() {
        this.#counter = 0;
    }
}

class Routine {
    constructor(clusterIdentifier, worker, dials, sessionID) {
        this.clusterIdentifier = clusterIdentifier;
        this.worker = worker;
        this.dials = dials;
        this.sessionID = sessionID;
        this.executing = false;
        this.enabled = true;
        this.failureCounter = new FailureCounter(5);
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
            this.worker.failureCounter.reset();
            return response;
        } catch (err) {
            this.failureCounter.increase();
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
        this.identifier = identifier;

        this.failureCounter = new FailureCounter(5);
    }

    async testAlive() {
        try {
            // TODO maybe add check if returned identifier is identical to object's property
            await axios.get(
                `http://${this.hostName}:${this.port}/api/identifier`
            );
            this.failureCounter.reset();
        } catch (err) {
            this.failureCounter.increase();
        }
    }
}

class Worker {
    constructor(hostName, port, identifier) {
        this.hostName = hostName;
        this.port = port;
        this.identifier = identifier;

        this.failureCounter = new FailureCounter(5);
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
            this.failureCounter.reset();
            return response;
        } catch (err) {
            this.failureCounter.increase();
            adapter.failureCounter.increase();
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

            this.failureCounter.reset();
        } catch (err) {
            this.failureCounter.increase();
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
            this.failureCounter.reset();
        } catch (err) {
            this.failureCounter.reset();
        }
    }
}

export {
    Routine,
    Cluster,
    Adapter,
    Worker
}