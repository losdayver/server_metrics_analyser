import express from 'express'
import { State } from '../persistance/state.mjs'

const router = express.Router()
const state = new State()

router.route('/clusters')
.get((req, res) => {
    res.status(200).send(state.getAdapters());
})
.post((req, res) => {
    res.setHeader('content-type', 'text/plain');

    state.addAdapter(req.body.HostName, req.body.Port)
    .then(() => {
        res.status(200).send("successfully added new adapter");
    })
    .catch((err) => {
        res.status(400).send(err.message);
    });
});

router.route('/workers')
.get((req, res) => {
    res.status(200).send(state.getWorkers());
})
.post((req, res) => {
    res.setHeader('content-type', 'text/plain');

    state.addWorker(req.body.HostName, req.body.Port)
    .then(() => {
        res.status(200).send("successfully added new worker");
    })
    .catch((err) => {
        res.status(400).send(err.message);
    });
});

router.route('/routines')
.get((req, res) => {
    res.status(200).send(state.getRoutines());
})
.post((req, res) => {
    res.setHeader('content-type', 'text/plain');

    state.addRoutine(req.body.ClusterIdentifier, req.body.WorkerHostName, 
        req.body.WorkerPort, req.body.DialNames, req.body.ClusterHostName)
    .then(() => {
        res.status(200).send("successfully added new adapter");
    })
    .catch((err) => {
        res.status(400).send(err.message);
    });
});

export default router