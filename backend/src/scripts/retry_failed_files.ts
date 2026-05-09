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

/**
 * 已下线：知识库功能已从开源版移除。
 */

console.log('知识库功能已从开源版移除，不再支持 retry_failed_files 脚本。');
