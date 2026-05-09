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

/**
 * 已下线：知识库相关调试脚本已移除。
 */

console.log('debug_file_path 已下线。');
