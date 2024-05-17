import express from "express";
import apiRouter from "./routers/api.mjs";
import { authMiddleware } from "./auth/auth.mjs";

import cors from "cors";
import process from "process";
import cookieParser from 'cookie-parser';

let port = 4321;

if (process.argv.length > 2) {
    port = process.argv[2];
}

var app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api", cors(), authMiddleware, apiRouter);

app.post("/authenticate/", (req, res) => {
    if (!(req.body.username && req.body.password)) {
        res.status(401).send("Invalid credentials!");
        return;
    }

    if (req.body.username === "admin" && req.body.password === "admin123") {
        res.status(200).send({
            sessionToken: "temp-session"
        });
        return;
    }

    res.status(401).send("Invalid credentials!");
});

app.listen(port, () => {
    console.log(`Starting Controller on port '${port}!'`);
});
