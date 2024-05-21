import express from "express";
import { State } from "../persistance/state.mjs";
import cors from "cors";

const router = express.Router();
router.options("*", cors());

const state = new State();

state.startRoutineLoop();
state.startIncidentFetchLoop();
state.startAliveLoop();

router
    .route("/clusters")
    .get((req, res) => {
        res.status(200).send(state.getAdapters());
    })
    .post((req, res) => {
        res.setHeader("content-type", "text/plain");

        state
            .addAdapter(req.body.HostName, req.body.Port)
            .then(() => {
                res.status(200).send("successfully added new adapter");
            })
            .catch((err) => {
                res.status(400).send(err.message);
            });
    });

router
    .route("/workers")
    .get((req, res) => {
        res.status(200).send(state.getWorkers());
    })
    .post((req, res) => {
        res.setHeader("content-type", "text/plain");

        state
            .addWorker(req.body.HostName, req.body.Port)
            .then(() => {
                res.status(200).send("successfully added new worker");
            })
            .catch((err) => {
                res.status(400).send(err.message);
            });
    });

router
    .route("/routines")
    .get((req, res) => {
        res.status(200).send(state.getRoutines());
    })
    .post((req, res) => {
        res.setHeader("content-type", "text/plain");

        state
            .addRoutine(
                req.body.ClusterIdentifier,
                req.body.WorkerHostName,
                req.body.WorkerPort,
                req.body.DialNames,
                req.body.ClusterHostName
            )
            .then(() => {
                res.status(200).send("successfully added new routine");
            })
            .catch((err) => {
                res.status(400).send(err.message);
            });
    });

router
    .route("/routines/kickstart")
    .post((req, res) => {
        state.kickStartRoutine(req.body.sessionID)
            .then(() => {
                res.status(200).send("successfully kickstarted routine");
            })
            .catch((err) => {
                res.status(400).send(err.message);
            });
    });

router.route("/incidents").get((req, res) => {
    const { from, to } = req.query;

    res.status(200).send(state.getIncidents(from, to));
});

router.route("/incidents/length/").get((req, res) => {
    res.status(200).send({ length: state.getIncidents().length });
});

export default router;
