/**
 * 报告解析 Worker
 * 
 * 功能：
 * 1. 定时获取报告列表（每天 7:00 和 22:00）
 * 2. 定时处理 pending 状态的报告
 * 3. 下载 PDF 到本地
 * 4. 使用 pdf-parse 提取文本并切片
 * 5. 调用 SiliconFlow 的 Embedding 接口获取向量
 * 6. 存储到 PostgreSQL 数据库
 */

import 'dotenv/config';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import pLimit from 'p-limit';
import pRetry, { AbortError } from 'p-retry';
import cron from 'node-cron';

// pdf-parse v2.x 导出 PDFParse 类
import { PDFParse } from 'pdf-parse';

// 类型定义
interface AxiosErrorLike {
    isAxiosError: boolean;
    response?: {
        status: number;
        headers: Record<string, string>;
    };
    message: string;
}

// 类型守卫：检查是否为 AxiosError
function isAxiosError(error: unknown): error is AxiosErrorLike {
    return typeof error === 'object' && error !== null && (error as any).isAxiosError === true;
}

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
    // Worker
    downloadDir: process.env.REPORT_DOWNLOAD_DIR || './downloads/reports',
    pollIntervalMs: parseInt(process.env.REPORT_POLL_INTERVAL_MS || '60000'),
    maxConcurrent: parseInt(process.env.REPORT_MAX_CONCURRENT || '3'),
    // Text chunking
    chunkSize: 500,        // 每个分片的最大字符数
    chunkOverlap: 50,      // 分片之间的重叠字符数
    // API rate limiting
    embeddingConcurrency: 2,  // 同时进行的 embedding 请求数
    embeddingRetries: 3,      // 重试次数
    embeddingRetryDelay: 1000, // 重试间隔 (ms)
    // 报告获取 API
    reportsApiUrl: process.env.REPORTS_API_URL || 'https://m.fckvip.cn/api/words/getWords?pageSize=100',
    // 定时任务 cron 表达式 (每天 7:00 和 22:00)
    fetchReportsCron: process.env.FETCH_REPORTS_CRON || '0 7,22 * * *',
};

// ============================================================
// 数据库连接池
// ============================================================

const pool = new Pool({
    host: config.postgres.host,
    port: config.postgres.port,
    user: config.postgres.user,
    password: config.postgres.password,
    database: config.postgres.database,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// 设置搜索路径
pool.on('connect', (client) => {
    client.query(`SET search_path TO ${config.postgres.schema}, public`);
});

// ============================================================
// 报告获取 API 接口
// ============================================================

interface WordItem {
    id: number;
    title: string;
    wordUrl: string;
    wordPath?: string;
    publishTime?: string;
    createTime?: string;
}

interface GetWordsResponse {
    result: number;
    msg: string | null;
    data: {
        pager: {
            currentPage: number;
            totalPages: number;
            totalRows: number;
        };
        list: WordItem[];
    };
}

/**
 * 从 API 获取报告列表并插入数据库
 */
async function fetchAndSaveReports(): Promise<number> {
    console.log(`\n[Scheduler] 开始获取报告列表...`);
    console.log(`[Scheduler] API: ${config.reportsApiUrl}`);

    try {
        const response = await axios.post<GetWordsResponse>(config.reportsApiUrl, {}, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Content-Type': 'application/json',
            },
        });

        if (response.data.result !== 200) {
            console.error(`[Scheduler] API 返回错误: ${response.data.msg}`);
            return 0;
        }

        const words = response.data.data?.list || [];
        console.log(`[Scheduler] 获取到 ${words.length} 条报告`);

        let insertedCount = 0;

        for (const word of words) {
            try {
                // 检查是否已存在 (使用 word_url 唯一索引)
                const existsResult = await pool.query(
                    `SELECT id FROM reports WHERE word_url = $1`,
                    [word.wordUrl]
                );

                if (existsResult.rows.length > 0) {
                    console.log(`[Scheduler] 报告已存在，跳过: ${word.title}`);
                    continue;
                }

                // 解析发布时间
                let publishTime: Date | null = null;
                if (word.publishTime) {
                    publishTime = new Date(word.publishTime);
                } else if (word.createTime) {
                    publishTime = new Date(word.createTime);
                }

                // 插入新报告
                await pool.query(
                    `INSERT INTO reports (title, word_url, publish_time, status, device_id) 
                     VALUES ($1, $2, $3, 'pending', 'scheduler')`,
                    [word.title, word.wordUrl, publishTime]
                );

                insertedCount++;
                console.log(`[Scheduler] ✅ 新增报告: ${word.title}`);

            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                // 如果是唯一约束冲突，忽略
                if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
                    console.log(`[Scheduler] 报告已存在 (并发冲突)，跳过: ${word.title}`);
                } else {
                    console.error(`[Scheduler] 插入报告失败: ${word.title}`, errorMessage);
                }
            }
        }

        console.log(`[Scheduler] 本次新增 ${insertedCount} 条报告`);
        return insertedCount;

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Scheduler] 获取报告列表失败:`, errorMessage);
        return 0;
    }
}

// ============================================================
// SiliconFlow Embedding 客户端
// ============================================================

interface EmbeddingResponse {
    data: Array<{
        embedding: number[];
        index: number;
    }>;
    model: string;
    usage: {
        prompt_tokens: number;
        total_tokens: number;
    };
}

async function getEmbedding(text: string): Promise<number[]> {
    const response = await axios.post<EmbeddingResponse>(
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

    if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0].embedding;
    }
    throw new Error('No embedding returned from API');
}

// 带重试的 embedding 获取
async function getEmbeddingWithRetry(text: string): Promise<number[]> {
    return pRetry(
        async () => {
            try {
                return await getEmbedding(text);
            } catch (error: unknown) {
                if (isAxiosError(error)) {
                    // 429 Too Many Requests - 需要等待后重试
                    if (error.response?.status === 429) {
                        const retryAfter = parseInt(error.response.headers['retry-after'] || '5');
                        console.log(`[Embedding] Rate limited, waiting ${retryAfter}s...`);
                        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    }
                    // 5xx 服务器错误 - 可重试
                    if (error.response?.status && error.response.status >= 500) {
                        throw error; // 让 p-retry 处理
                    }
                    // 4xx 客户端错误 (非429) - 不重试
                    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
                        throw new AbortError(error.message);
                    }
                }
                throw error;
            }
        },
        {
            retries: config.embeddingRetries,
            minTimeout: config.embeddingRetryDelay,
            onFailedAttempt: (error) => {
                console.log(`[Embedding] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
            },
        }
    );
}

// ============================================================
// PDF 处理
// ============================================================

async function downloadPdf(url: string, localPath: string): Promise<void> {
    const response = await axios.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
    });

    // 确保目录存在
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(localPath, Buffer.from(response.data));
    console.log(`[PDF] Downloaded to ${localPath}`);
}

async function extractTextFromPdf(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    // pdf-parse v2.x 需要 Uint8Array 而不是 Buffer
    const uint8Array = new Uint8Array(dataBuffer);
    const parser = new PDFParse(uint8Array);
    const result = await parser.getText();
    // 返回结果可能是对象，提取 text 属性
    return typeof result === 'string' ? result : (result as any).text || String(result);
}

// ============================================================
// 文本分片
// ============================================================

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];

    // 清理文本
    const cleanText = text
        .replace(/\s+/g, ' ')  // 合并多个空白字符
        .trim();

    if (cleanText.length <= chunkSize) {
        return [cleanText];
    }

    let start = 0;
    while (start < cleanText.length) {
        let end = start + chunkSize;

        // 尝试在句子边界切分
        if (end < cleanText.length) {
            const lastPeriod = cleanText.lastIndexOf('。', end);
            const lastQuestion = cleanText.lastIndexOf('？', end);
            const lastExclaim = cleanText.lastIndexOf('！', end);
            const lastNewline = cleanText.lastIndexOf('\n', end);

            const breakPoint = Math.max(lastPeriod, lastQuestion, lastExclaim, lastNewline);
            if (breakPoint > start + chunkSize / 2) {
                end = breakPoint + 1;
            }
        }

        const chunk = cleanText.slice(start, end).trim();
        if (chunk.length > 0) {
            chunks.push(chunk);
        }

        start = end - overlap;
        if (start < 0) start = 0;
        if (start >= cleanText.length) break;
    }

    return chunks;
}

// ============================================================
// 数据库操作
// ============================================================

interface Report {
    id: number;
    title: string;
    word_url: string;
    status: string;
    local_path: string | null;
    device_id: string;
}

async function getPendingReports(limit: number = 10): Promise<Report[]> {
    const result = await pool.query<Report>(
        `SELECT id, title, word_url, status, local_path, device_id 
         FROM reports 
         WHERE status = 'pending' 
         ORDER BY created_at ASC 
         LIMIT $1`,
        [limit]
    );
    return result.rows;
}

async function updateReportStatus(id: number, status: 'pending' | 'processing' | 'completed', localPath?: string): Promise<void> {
    if (localPath) {
        await pool.query(
            `UPDATE reports SET status = $1, local_path = $2 WHERE id = $3`,
            [status, localPath, id]
        );
    } else {
        await pool.query(
            `UPDATE reports SET status = $1 WHERE id = $2`,
            [status, id]
        );
    }
}

async function saveEmbeddings(reportId: number, chunks: string[], embeddings: number[][]): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 删除旧的 embeddings
        await client.query('DELETE FROM report_embeddings WHERE report_id = $1', [reportId]);

        // 插入新的 embeddings
        for (let i = 0; i < chunks.length; i++) {
            const embeddingStr = `[${embeddings[i].join(',')}]`;
            await client.query(
                `INSERT INTO report_embeddings (report_id, content, embedding, chunk_index) 
                 VALUES ($1, $2, $3::vector, $4)`,
                [reportId, chunks[i], embeddingStr, i]
            );
        }

        await client.query('COMMIT');
        console.log(`[DB] Saved ${chunks.length} embeddings for report ${reportId}`);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// ============================================================
// 报告处理流程
// ============================================================

async function processReport(report: Report): Promise<void> {
    console.log(`\n[Worker] Processing report ${report.id}: ${report.title}`);

    try {
        // 1. 更新状态为 processing
        await updateReportStatus(report.id, 'processing');

        // 2. 下载 PDF
        const fileName = `report_${report.id}_${Date.now()}.pdf`;
        const localPath = path.join(config.downloadDir, fileName);

        await downloadPdf(report.word_url, localPath);
        await updateReportStatus(report.id, 'processing', localPath);

        // 3. 提取文本
        console.log(`[Worker] Extracting text from PDF...`);
        const text = await extractTextFromPdf(localPath);
        console.log(`[Worker] Extracted ${text.length} characters`);

        // 4. 文本分片
        const chunks = chunkText(text, config.chunkSize, config.chunkOverlap);
        console.log(`[Worker] Split into ${chunks.length} chunks`);

        // 5. 获取 embeddings (并发限制)
        console.log(`[Worker] Getting embeddings...`);
        const limit = pLimit(config.embeddingConcurrency);
        const embeddingPromises = chunks.map((chunk, index) =>
            limit(async () => {
                const embedding = await getEmbeddingWithRetry(chunk);
                console.log(`[Worker] Embedded chunk ${index + 1}/${chunks.length}`);
                return embedding;
            })
        );
        const embeddings = await Promise.all(embeddingPromises);

        // 6. 保存到数据库
        await saveEmbeddings(report.id, chunks, embeddings);

        // 7. 更新状态为 completed
        await updateReportStatus(report.id, 'completed');
        console.log(`[Worker] ✅ Report ${report.id} completed successfully`);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Worker] ❌ Error processing report ${report.id}:`, errorMessage);
        // 失败时重置为 pending，以便稍后重试
        await updateReportStatus(report.id, 'pending');
        throw error;
    }
}

// ============================================================
// Worker 主循环
// ============================================================

async function runWorker(): Promise<void> {
    console.log('========================================');
    console.log('报告解析 Worker 启动');
    console.log(`SiliconFlow Model: ${config.siliconflow.model}`);
    console.log(`PostgreSQL: ${config.postgres.host}/${config.postgres.database}`);
    console.log(`Poll Interval: ${config.pollIntervalMs}ms`);
    console.log(`Max Concurrent: ${config.maxConcurrent}`);
    console.log(`Reports API: ${config.reportsApiUrl}`);
    console.log(`Fetch Cron: ${config.fetchReportsCron} (每天 7:00 和 22:00)`);
    console.log('========================================\n');

    // 确保下载目录存在
    if (!fs.existsSync(config.downloadDir)) {
        fs.mkdirSync(config.downloadDir, { recursive: true });
    }

    // ============================================================
    // 设置定时任务：每天 7:00 和 22:00 获取报告
    // ============================================================
    cron.schedule(config.fetchReportsCron, async () => {
        console.log(`\n[Cron] ⏰ 定时任务触发: ${new Date().toLocaleString()}`);
        await fetchAndSaveReports();
    }, {
        timezone: 'Asia/Shanghai'  // 使用中国时区
    });

    console.log(`[Cron] 定时任务已启动，下次执行时间: 7:00 或 22:00`);

    // 启动时立即执行一次获取
    console.log(`[Worker] 启动时执行一次报告获取...`);
    await fetchAndSaveReports();

    // ============================================================
    // 报告处理主循环
    // ============================================================
    const processLimit = pLimit(config.maxConcurrent);

    while (true) {
        try {
            console.log(`[Worker] Checking for pending reports...`);
            const reports = await getPendingReports(config.maxConcurrent * 2);

            if (reports.length === 0) {
                console.log(`[Worker] No pending reports. Waiting ${config.pollIntervalMs}ms...`);
            } else {
                console.log(`[Worker] Found ${reports.length} pending reports`);

                // 并发处理报告
                const tasks = reports.map(report =>
                    processLimit(() => processReport(report).catch((err: unknown) => {
                        const errorMessage = err instanceof Error ? err.message : String(err);
                        console.error(`[Worker] Failed to process report ${report.id}:`, errorMessage);
                    }))
                );

                await Promise.all(tasks);
            }

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[Worker] Error in main loop:', errorMessage);
        }

        // 等待下一次轮询
        await new Promise(resolve => setTimeout(resolve, config.pollIntervalMs));
    }
}

// ============================================================
// 启动
// ============================================================

// 验证配置
if (!config.siliconflow.apiKey) {
    console.error('Error: SILICONFLOW_API_KEY is not set');
    process.exit(1);
}

if (!config.postgres.host || !config.postgres.user || !config.postgres.password) {
    console.error('Error: PostgreSQL configuration is incomplete');
    process.exit(1);
}

// 启动 worker
runWorker().catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Worker crashed:', errorMessage);
    process.exit(1);
});
