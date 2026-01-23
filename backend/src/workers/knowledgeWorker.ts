/**
 * 用户知识库向量化 Worker
 * 
 * 功能：
 * - 轮询 user_knowledge_files 表中状态为 'parsing' 的文件
 * - 重新处理状态为 'failed' 的文件（重试机制）
 * - 使用 SiliconFlow API 生成 BGE-M3 向量
 * - 实现并发控制和重试逻辑
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
// Explicitly resolve .env path
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Pool } from 'pg';
import * as fs from 'fs';
import axios from 'axios';
const PDFParse = require('pdf-parse');
import mammoth from 'mammoth';
import officeParser from 'officeparser';
import pLimit from 'p-limit';
import pRetry, { AbortError } from 'p-retry';

// ============================================================
// 配置
// ============================================================

const config = {
    // SiliconFlow API
    siliconflow: {
        apiKey: process.env.SILICONFLOW_API_KEY!,
        baseUrl: process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1',
        model: process.env.SILICONFLOW_MODEL || 'BAAI/bge-m3',
    },
    // PostgreSQL
    postgres: {
        host: process.env.POSTGRES_HOST!,
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        user: process.env.POSTGRES_USER!,
        password: process.env.POSTGRES_PASSWORD!,
        database: process.env.POSTGRES_DB!,
        schema: process.env.POSTGRES_SCHEMA || 'mcp',
    },
    // Worker 配置
    uploadDir: process.env.USER_KB_UPLOAD_DIR || '/data/user_kb',
    pollIntervalMs: parseInt(process.env.KB_POLL_INTERVAL_MS || '30000'), // 30秒
    maxConcurrent: parseInt(process.env.KB_MAX_CONCURRENT || '2'),        // 同时处理2个文件
    // 文本分片
    chunkSize: 600,        // 每个分片的最大字符数
    chunkOverlap: 100,     // 分片之间的重叠字符数
    // Embedding 并发控制
    embeddingConcurrency: 2,   // 同时进行的 embedding 请求数
    embeddingRetries: 3,       // 重试次数
    embeddingRetryDelay: 2000, // 重试间隔 (ms)
    embeddingRequestDelay: 300, // 每个请求间隔 (ms)，避免速率限制
};

// ============================================================
// PostgreSQL 连接池
// ============================================================

const pool = new Pool({
    host: config.postgres.host,
    port: config.postgres.port,
    user: config.postgres.user,
    password: config.postgres.password,
    database: config.postgres.database,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on('connect', (client: any) => {
    client.query(`SET search_path TO ${config.postgres.schema}, public`);
});

// ============================================================
// 类型定义
// ============================================================

interface KnowledgeFile {
    id: number;
    user_id: number;
    file_name: string;
    file_type: string;
    file_size: number;
    status: string;
}

// ============================================================
// 文件解析器
// ============================================================

async function parsePdf(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const result = await PDFParse(Buffer.from(dataBuffer));
    return result.text;
}

async function parseDocx(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
}

async function parseOffice(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        officeParser.parseOffice(filePath, (result: any, err: any) => {
            if (err) {
                reject(err);
            } else {
                const text = typeof result === 'string' ? result : (result?.text || JSON.stringify(result));
                resolve(text || '');
            }
        });
    });
}

async function parseTxt(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, 'utf-8');
}

const XLSX = require('xlsx');

async function parseExcel(filePath: string): Promise<string> {
    const workbook = XLSX.readFile(filePath);
    let text = '';
    // Iterate through all sheets
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        text += `[${sheetName}]\n${csv}\n\n`;
    }
    return text;
}

async function parseFile(filePath: string, fileType: string): Promise<string> {
    const ext = fileType.toLowerCase();

    switch (ext) {
        case 'pdf':
            return parsePdf(filePath);
        case 'docx':
        case 'doc':
            return parseDocx(filePath);
        case 'xlsx':
        case 'xls':
            return parseExcel(filePath);
        case 'pptx':
        case 'ppt':
            return parseOffice(filePath);
        case 'txt':
        case 'md':
        case 'json':
            return parseTxt(filePath);
        default:
            throw new Error(`Unsupported file type: ${ext}`);
    }
}

// ============================================================
// 文本分片
// ============================================================

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    // 清理文本
    text = text.replace(/\s+/g, ' ').trim();

    while (start < text.length) {
        let end = start + chunkSize;

        // 尝试在句子边界处切分
        if (end < text.length) {
            const lastPeriod = text.lastIndexOf('。', end);
            const lastQuestion = text.lastIndexOf('？', end);
            const lastExclaim = text.lastIndexOf('！', end);
            const lastDot = text.lastIndexOf('. ', end);

            const breakPoint = Math.max(lastPeriod, lastQuestion, lastExclaim, lastDot);
            if (breakPoint > start + chunkSize / 2) {
                end = breakPoint + 1;
            }
        }

        chunks.push(text.slice(start, end).trim());
        start = end - overlap;

        if (start < 0) start = 0;
        if (start >= text.length) break;
    }

    return chunks.filter(chunk => chunk.length > 10);
}

// ============================================================
// Embedding 生成（带重试和速率限制）
// ============================================================

async function getEmbedding(text: string): Promise<number[]> {
    const response = await axios.post(
        `${config.siliconflow.baseUrl}/embeddings`,
        {
            model: config.siliconflow.model,
            input: text,
            encoding_format: 'float',
        },
        {
            headers: {
                'Authorization': `Bearer ${config.siliconflow.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        }
    );

    const data = response.data as any;
    if (data.data && data.data.length > 0) {
        return data.data[0].embedding;
    }
    throw new Error('No embedding returned from API');
}

async function getEmbeddingWithRetry(text: string): Promise<number[]> {
    return pRetry(
        async () => {
            try {
                return await getEmbedding(text);
            } catch (error: any) {
                // 429 Too Many Requests - 等待后重试
                if (error.response?.status === 429) {
                    const retryAfter = parseInt(error.response.headers['retry-after'] || '5');
                    console.log(`[Worker] Rate limited, waiting ${retryAfter}s...`);
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    throw error; // 让 p-retry 处理
                }
                // 5xx 服务器错误 - 可重试
                if (error.response?.status >= 500) {
                    throw error;
                }
                // 4xx 客户端错误 (非429) - 不重试
                if (error.response?.status >= 400 && error.response?.status < 500) {
                    throw new AbortError(error.message);
                }
                throw error;
            }
        },
        {
            retries: config.embeddingRetries,
            minTimeout: config.embeddingRetryDelay,
            onFailedAttempt: (error: any) => {
                console.log(`[Worker] Embedding attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
            },
        }
    );
}

// ============================================================
// 数据库操作
// ============================================================

async function getPendingFiles(): Promise<KnowledgeFile[]> {
    const result = await pool.query(
        `SELECT * FROM user_knowledge_files 
         WHERE status IN ('parsing', 'pending')
         ORDER BY created_at ASC
         LIMIT $1`,
        [config.maxConcurrent]
    );
    return result.rows;
}

async function getFailedFiles(): Promise<KnowledgeFile[]> {
    const result = await pool.query(
        `SELECT * FROM user_knowledge_files 
         WHERE status = 'failed'
           AND updated_at < NOW() - INTERVAL '5 minutes'
         ORDER BY updated_at ASC
         LIMIT 1`
    );
    return result.rows;
}

async function updateFileStatus(
    fileId: number,
    status: string,
    chunkCount?: number,
    errorMessage?: string
): Promise<void> {
    if (chunkCount !== undefined) {
        await pool.query(
            `UPDATE user_knowledge_files 
             SET status = $1, chunk_count = $2, error_message = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [status, chunkCount, errorMessage || null, fileId]
        );
    } else {
        await pool.query(
            `UPDATE user_knowledge_files 
             SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [status, errorMessage || null, fileId]
        );
    }
}

async function saveEmbeddings(
    fileId: number,
    userId: number,
    chunks: string[],
    embeddings: number[][]
): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 删除旧的 embeddings
        await client.query('DELETE FROM user_knowledge_embeddings WHERE file_id = $1', [fileId]);

        // 插入新的 embeddings
        for (let i = 0; i < chunks.length; i++) {
            const embeddingStr = `[${embeddings[i].join(',')}]`;
            await client.query(
                `INSERT INTO user_knowledge_embeddings (file_id, user_id, content, embedding, chunk_index)
                 VALUES ($1, $2, $3, $4::vector, $5)`,
                [fileId, userId, chunks[i], embeddingStr, i]
            );
        }

        await client.query('COMMIT');
        console.log(`[Worker] Saved ${chunks.length} embeddings for file ${fileId}`);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// ============================================================
// 文件处理主逻辑
// ============================================================

async function processFile(file: KnowledgeFile): Promise<void> {
    console.log(`\n[Worker] Processing file ${file.id}: ${file.file_name}`);

    try {
        // 1. 查找文件路径
        const userDir = path.join(config.uploadDir, String(file.user_id));
        const files = fs.existsSync(userDir) ? fs.readdirSync(userDir) : [];

        console.log(`[Worker Debug] UserDir: ${userDir}`);
        console.log(`[Worker Debug] Target: ${file.file_name}`);
        console.log(`[Worker Debug] Files: ${JSON.stringify(files)}`);

        // 查找匹配的文件 (格式: timestamp_filename)
        const matchedFile = files.find(f => f.endsWith(file.file_name));
        if (!matchedFile) {
            throw new Error(`File not found in upload directory: ${file.file_name}`);
        }

        const filePath = path.join(userDir, matchedFile);
        console.log(`[Worker] File path: ${filePath}`);

        // 2. 更新状态为 processing
        await updateFileStatus(file.id, 'processing');

        // 3. 解析文件
        console.log(`[Worker] Parsing ${file.file_type} file...`);
        const text = await parseFile(filePath, file.file_type);
        console.log(`[Worker] Extracted ${text.length} characters`);

        if (text.length < 10) {
            throw new Error('File content is too short or empty');
        }

        // 4. 文本分片
        const chunks = chunkText(text, config.chunkSize, config.chunkOverlap);
        console.log(`[Worker] Split into ${chunks.length} chunks`);

        // 5. 生成 embeddings (并发控制)
        console.log(`[Worker] Generating embeddings...`);
        const limit = pLimit(config.embeddingConcurrency);
        const embeddingPromises = chunks.map((chunk, index) =>
            limit(async () => {
                const embedding = await getEmbeddingWithRetry(chunk);
                console.log(`[Worker] Embedded chunk ${index + 1}/${chunks.length}`);

                // 每个请求后延迟，避免速率限制
                await new Promise(resolve => setTimeout(resolve, config.embeddingRequestDelay));

                return embedding;
            })
        );
        const embeddings = await Promise.all(embeddingPromises);

        // 6. 保存到数据库
        await saveEmbeddings(file.id, file.user_id, chunks, embeddings);

        // 7. 更新状态为 completed
        await updateFileStatus(file.id, 'completed', chunks.length);
        console.log(`[Worker] ✅ File ${file.id} completed successfully`);

        // 8. 可选：删除本地文件以节省空间
        // fs.unlinkSync(filePath);

    } catch (error: any) {
        console.error(`[Worker] ❌ Error processing file ${file.id}:`, error.message);
        await updateFileStatus(file.id, 'failed', undefined, error.message);
    }
}

// ============================================================
// Worker 主循环
// ============================================================

async function runWorker(): Promise<void> {
    console.log('========================================');
    console.log('用户知识库向量化 Worker 启动');
    console.log(`SiliconFlow Model: ${config.siliconflow.model}`);
    console.log(`PostgreSQL: ${config.postgres.host}/${config.postgres.database}`);
    console.log(`Poll Interval: ${config.pollIntervalMs}ms`);
    console.log(`Max Concurrent: ${config.maxConcurrent}`);
    console.log(`Embedding Concurrency: ${config.embeddingConcurrency}`);
    console.log(`Upload Dir: ${config.uploadDir}`);
    console.log('========================================\n');

    const processLoop = async () => {
        try {
            // 1. 获取待处理的文件
            const pendingFiles = await getPendingFiles();

            // 2. 也检查需要重试的失败文件
            const failedFiles = await getFailedFiles();

            const filesToProcess = [...pendingFiles, ...failedFiles];

            if (filesToProcess.length > 0) {
                console.log(`[Worker] Found ${filesToProcess.length} files to process`);

                // 并发处理
                const limit = pLimit(config.maxConcurrent);
                await Promise.all(
                    filesToProcess.map(file => limit(() => processFile(file)))
                );
            }
        } catch (error: any) {
            console.error('[Worker] Loop error:', error.message);
        }
    };

    // 立即执行一次
    await processLoop();

    // 定时轮询
    setInterval(processLoop, config.pollIntervalMs);

    console.log('[Worker] Worker is running. Press Ctrl+C to stop.\n');
}

// 启动 Worker
runWorker().catch(console.error);
