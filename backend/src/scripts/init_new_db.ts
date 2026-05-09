
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Config
const config = {
    postgres: {
        host: process.env.POSTGRES_HOST!,
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        user: process.env.POSTGRES_USER!,
        password: process.env.POSTGRES_PASSWORD!,
        database: process.env.POSTGRES_DB!,
        schema: process.env.POSTGRES_SCHEMA || 'mcp',
    }
};

const pool = new Pool(config.postgres);

console.log(`Connecting to ${config.postgres.host} / ${config.postgres.database}...`);

async function runSqlFile(filename: string) {
    const filePath = path.join(__dirname, filename);
    console.log(`Executing ${filename}...`);
    try {
        const sql = fs.readFileSync(filePath, 'utf8');
        const client = await pool.connect();
        try {
            await client.query(`CREATE SCHEMA IF NOT EXISTS ${config.postgres.schema}`);
            await client.query(`SET search_path TO ${config.postgres.schema}, public`);
            await client.query(sql);
            console.log(`Successfully executed ${filename}`);
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error(`Error executing ${filename}:`, error.message);
        throw error;
    }
}

async function init() {
    try {
        // Run report initialization
        await runSqlFile('init_report_db.sql');

        console.log("Database initialization completed successfully.");
    } catch (error) {
        console.error("Initialization failed.");
        process.exit(1);
    } finally {
        await pool.end();
    }
}

init();
