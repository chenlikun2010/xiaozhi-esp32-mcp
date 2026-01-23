
import 'dotenv/config';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
    host: process.env.POSTGRES_HOST!,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DB!,
    schema: process.env.POSTGRES_SCHEMA || 'mcp',
    uploadDir: process.env.USER_KB_UPLOAD_DIR
};

const pool = new Pool(config);

async function debugFile() {
    const client = await pool.connect();
    try {
        await client.query(`SET search_path TO ${config.schema}, public`);
        const res = await client.query('SELECT user_id, file_name FROM user_knowledge_files WHERE id = 65');

        if (res.rows.length === 0) {
            console.log('File 65 not found in DB');
            return;
        }

        const { user_id, file_name } = res.rows[0];
        console.log(`DB Info: ID=65, User=${user_id}, Name=${file_name}`);

        const userDir = path.join(config.uploadDir!, String(user_id));
        console.log(`Checking dir: ${userDir}`);

        if (fs.existsSync(userDir)) {
            const files = fs.readdirSync(userDir);
            console.log('Files on disk:', files);

            const matched = files.find(f => f.endsWith(file_name));
            console.log('Match found:', matched);
        } else {
            console.log('User directory does not exist!');
        }

    } catch (error) {
        console.error(error);
    } finally {
        client.release();
        pool.end();
    }
}

debugFile();
