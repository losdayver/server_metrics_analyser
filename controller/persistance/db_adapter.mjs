import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
const { Pool } = pkg;

class pgAdapter {
    constructor() {
        const currentDir = path.dirname(fileURLToPath(import.meta.url))
        const relativePath = path.join(currentDir, "conf.d", "pg.conf");
        this.config = JSON.parse(fs.readFileSync(relativePath, 'utf8'));
        this.pool = new Pool(this.config);
    }


}

export {
    pgAdapter
} 