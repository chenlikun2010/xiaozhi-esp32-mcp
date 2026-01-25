
import axios from 'axios';
import { Pool } from 'pg';
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

const pool = new Pool({
    host: config.postgres.host,
    port: config.postgres.port,
    user: config.postgres.user,
    password: config.postgres.password,
    database: config.postgres.database,
});

pool.on('connect', (client: any) => {
    client.query(`SET search_path TO ${config.postgres.schema}, public`);
});

async function fetchLatestReports(limit: number = 200) {
    console.log(`Fetching latest ${limit} reports from source...`);

    // API limits pageSize usually, so we might need to paginate. 
    // Assuming 20 per page typical max? 
    // Let's try pageSize 50 and loop 4 times?
    const pageSize = 50;
    const totalPages = Math.ceil(limit / pageSize);
    let totalAdded = 0;

    for (let page = 1; page <= totalPages; page++) {
        console.log(`Fetching page ${page}...`);
        try {
            const response = await axios.post(
                'https://m.fckvip.cn/api/words/getWords',
                {},
                {
                    params: {
                        pageSize: pageSize,
                        pageNum: page, // Verify if API supports pageNum
                        keyword: ''    // Empty keyword for latest?
                    },
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            const result = response.data as any;
            if (result.result !== 200 || !result.data?.list) {
                console.warn(`Page ${page} returned invalid data.`, result);
                break;
            }

            const words = result.data.list;
            if (words.length === 0) {
                console.log("No more reports found.");
                break;
            }

            for (const word of words) {
                try {
                    // Check existence
                    const exists = await pool.query('SELECT id FROM reports WHERE word_url = $1', [word.wordUrl]);
                    if (exists.rows.length === 0) {
                        const publishTime = word.publishTime ? new Date(word.publishTime) : new Date();
                        await pool.query(
                            `INSERT INTO reports (title, word_url, publish_time, status, device_id) 
                             VALUES ($1, $2, $3, 'pending', 'report_expert')`,
                            [word.title, word.wordUrl, publishTime]
                        );
                        totalAdded++;
                        console.log(`[+] Added: ${word.title}`);
                    } else {
                        // console.log(`[~] Skipped (exists): ${word.title}`);
                    }
                } catch (err: any) {
                    console.error('Error inserting report:', err.message);
                }
            }

        } catch (error: any) {
            console.error(`Error processing page ${page}:`, error.message);
        }

        // Small delay to be nice
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\nDone. Added ${totalAdded} new reports.`);
    process.exit(0);
}

fetchLatestReports(200);
