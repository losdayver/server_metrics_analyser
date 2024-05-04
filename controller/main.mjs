import express from "express";
import apiRouter from "./routers/api.mjs";
import { State } from "./persistance/state.mjs";
import cors from "cors";
import process from "process";

let port = 4321;

if (process.argv.length > 2) {
    port = process.argv[2];
}

var app = express();

app.use(cors());
app.use(express.json());

app.use("/api", cors(), apiRouter);

app.listen(port, () => {
    console.log(`Starting Controller on port '${port}!'`);
});
