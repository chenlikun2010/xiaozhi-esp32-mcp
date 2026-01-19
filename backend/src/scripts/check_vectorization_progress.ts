
import { Pool } from 'pg';
import 'dotenv/config';

const config = {
    postgres: {
        host: process.env.POSTGRES_HOST!,
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        user: process.env.POSTGRES_USER!,
        password: process.env.POSTGRES_PASSWORD!,
        database: process.env.POSTGRES_DB!,
        schema: process.env.POSTGRES_SCHEMA || 'mcp',
    },
};

const pool = new Pool(config.postgres);

async function checkProgress() {
    const client = await pool.connect();
    try {
        await client.query(`SET search_path TO ${config.postgres.schema}, public`);

        console.log("=== Report Vectorization Status ===");

        // Get counts by status
        const countRes = await client.query(`
            SELECT status, COUNT(*) as count 
            FROM reports 
            GROUP BY status
        `);

        let total = 0;
        countRes.rows.forEach((row: any) => {
            console.log(`[${row.status.toUpperCase()}]: ${row.count}`);
            total += parseInt(row.count);
        });
        console.log(`TOTAL: ${total}`);

        // Get latest completed
        console.log("\n=== Latest Completed via Worker ===");
        const latestRes = await client.query(`
            SELECT id, title, created_at 
            FROM reports 
            WHERE status = 'completed' 
            ORDER BY id DESC 
            LIMIT 5
        `);

        latestRes.rows.forEach((row: any) => {
            console.log(`[ID:${row.id}] ${row.title} (Time: ${row.created_at})`);
        });

    } catch (error) {
        console.error("Error checking progress:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkProgress();
