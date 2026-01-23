
import 'dotenv/config';
import { Pool } from 'pg';
import path from 'path';
import * as dotenv from 'dotenv'; // Explicitly load dotenv

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
    host: process.env.POSTGRES_HOST!,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DB!,
    schema: process.env.POSTGRES_SCHEMA || 'mcp',
};

const pool = new Pool(config);

async function retryFailed() {
    const client = await pool.connect();
    try {
        await client.query(`SET search_path TO ${config.schema}, public`);
        const result = await client.query(`
            UPDATE user_knowledge_files 
            SET status = 'pending', error_message = NULL, updated_at = CURRENT_TIMESTAMP 
            WHERE status = 'failed'
        `);
        console.log(`Reset ${result.rowCount} failed files to pending.`);
    } catch (error) {
        console.error('Error resetting files:', error);
    } finally {
        client.release();
        pool.end();
    }
}

retryFailed();
