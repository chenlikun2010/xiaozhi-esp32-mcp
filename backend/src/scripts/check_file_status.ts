
import 'dotenv/config';
import { Pool } from 'pg';
import path from 'path';
import * as dotenv from 'dotenv';

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

async function checkStatus() {
    const client = await pool.connect();
    try {
        await client.query(`SET search_path TO ${config.schema}, public`);
        // Check file 65 specifically, or recent files
        const result = await client.query(`
            SELECT id, file_name, status, error_message, chunk_count, created_at, updated_at 
            FROM user_knowledge_files 
            WHERE id = 65
        `);
        console.table(result.rows);
    } catch (error) {
        console.error('Error checking status:', error);
    } finally {
        client.release();
        pool.end();
    }
}

checkStatus();
