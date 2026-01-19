
import { Pool } from 'pg';
import axios from 'axios';
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

async function checkReports() {
    try {
        console.log("Fetching latest 20 reports from API...");
        const response = await axios.post(
            'https://m.fckvip.cn//api/words/getWords?pageSize=20',
            {},
            { headers: { 'Content-Type': 'application/json' } }
        );

        const data = response.data as any;

        if (data.result !== 200 || !data.data?.list) {
            console.error("API Error:", data);
            return;
        }

        const apiReports = data.data.list;
        console.log(`API returned ${apiReports.length} reports.`);

        const client = await pool.connect();
        try {
            await client.query(`SET search_path TO ${config.postgres.schema}, public`);

            let inDbCount = 0;
            let completedCount = 0;

            console.log("\nChecking Database Status:");
            console.log("----------------------------------------");

            for (const report of apiReports) {
                const res = await client.query(
                    'SELECT id, status FROM reports WHERE word_url = $1',
                    [report.wordUrl]
                );

                const exists = res.rows.length > 0;
                let status = "MISSING";

                if (exists) {
                    inDbCount++;
                    status = res.rows[0].status;
                    if (status === 'completed') completedCount++;
                }

                console.log(`[${status.padEnd(10)}] ${report.title.substring(0, 40)}...`);
            }

            console.log("----------------------------------------");
            console.log(`Total Reports from API: ${apiReports.length}`);
            console.log(`Found in DB: ${inDbCount}`);
            console.log(`Vectorized (completed): ${completedCount}`);

            if (inDbCount < apiReports.length) {
                console.log(`\n${apiReports.length - inDbCount} reports are missing from the DB and need to be fetched.`);
            } else if (completedCount < inDbCount) {
                console.log(`\nAll reports are in DB, but ${inDbCount - completedCount} are still processing (pending/processing/failed).`);
            } else {
                console.log("\nAll 20 reports are successfully vectored in the database.");
            }

        } finally {
            client.release();
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await pool.end();
    }
}

checkReports();
