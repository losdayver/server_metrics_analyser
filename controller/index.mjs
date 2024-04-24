import express from 'express'
import apiRouter from './routers/api.mjs'
import {State} from './persistance/state.mjs'
import cors from 'cors'

const port = 4321;

var app = express();

app.use(express.json());

app.use('/api', apiRouter);
app.use(cors);

app.listen(port, () => {
	console.log(`server listening on ${port}!`);
});