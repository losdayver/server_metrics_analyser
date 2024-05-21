import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
const { Pool } = pkg;
import {
    Routine,
    Cluster,
    Adapter,
    Worker
} from "./types.mjs";

class pgAdapter {
    constructor() {
        const currentDir = path.dirname(fileURLToPath(import.meta.url))
        const relativePath = path.join(currentDir, "conf.d", "pg.conf");
        this.config = JSON.parse(fs.readFileSync(relativePath, "utf8"));
        this.pool = new Pool(this.config);
    }

    async uploadIncidents(incidents) {
        try {
            var client = await this.pool.connect();
            await client.query('BEGIN');
            const query = `INSERT INTO public.incidents 
            (host_name, adapter_identifier, date_time, dial_name,
                dial_unit, dial_threshold, dial_runcount, value) VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8)`;

            // Iterate through the data and execute the query for each row
            for (const incident of incidents) {
                const values = [incident.HostName,
                incident.AdapterIdentifier,
                incident.DateTime,
                incident.Dial.Name,
                incident.Dial.Unit,
                incident.Dial.Threshold,
                incident.Dial.RunCount,
                incident.Value,
                ];
                await client.query(query, values);
            }
            await client.query('COMMIT');
        } catch (err) {
            throw err;
        } finally {
            try {
                client.release();
            } catch { }
        }
    }

    getIncidents(from = null, to = null) {

    }
}

export {
    pgAdapter
} 