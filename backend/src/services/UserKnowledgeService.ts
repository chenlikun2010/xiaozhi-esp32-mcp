import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import mammoth from 'mammoth';
import officeParser from 'officeparser';
import { convertPdfToImages } from '../utils/pdf_to_image';
import { recognizePage } from '../utils/deepseek_ocr';

// pdf-parse v1.1.1 - 简单函数调用
const pdfParse = require('pdf-parse');
// xlsx - 用于解析 Excel 文件 (支持 xls 和 xlsx)
const XLSX = require('xlsx');

// PostgreSQL 连接配置 - 懒加载
let pool: Pool | null = null;
let poolInitialized = false;
let poolError: Error | null = null;

function getPool(): Pool {
    if (poolError) {
        throw poolError;
    }
    if (!pool) {
        pool = new Pool({
            host: process.env.POSTGRES_HOST!,
            port: parseInt(process.env.POSTGRES_PORT || '5432'),
            user: process.env.POSTGRES_USER!,
            password: process.env.POSTGRES_PASSWORD!,
            database: process.env.POSTGRES_DB!,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000, // 5 秒连接超时
        });

        pool.on('connect', (client: any) => {
            const schema = process.env.POSTGRES_SCHEMA || 'mcp';
            client.query(`SET search_path TO ${schema}, public`);
        });

        pool.on('error', (err: Error) => {
            console.error('[PostgreSQL] Pool error:', err.message);
        });
    }
    return pool;
}

// 测试连接
async function testConnection(): Promise<boolean> {
    if (poolInitialized) return !poolError;

    try {
        const p = getPool();
        await p.query('SELECT 1');
        poolInitialized = true;
        console.log('[PostgreSQL] Connection successful');
        return true;
    } catch (err: any) {
        poolInitialized = true;
        poolError = err;
        console.error('[PostgreSQL] Connection failed:', err.message);
        return false;
    }
}

// ============================================================
// 类型定义
// ============================================================

export interface KnowledgeFile {
    id: number;
    user_id: number;
    file_name: string;
    file_type: string;
    file_size: number;
    status: 'pending' | 'parsing' | 'completed' | 'failed' | 'OCR识别中';
    chunk_count: number;
    error_message?: string;
    created_at: Date;
}

export interface SearchResult {
    file_id: number;
    file_name: string;
    content: string;
    similarity: number;
}

// ============================================================
// 配置
// ============================================================

const config = {
    uploadDir: process.env.USER_KB_UPLOAD_DIR || path.join(__dirname, '../../uploads/user_kb'),
    chunkSize: 600,       // 每个分片的最大字符数
    chunkOverlap: 100,    // 分片之间的重叠字符数
    siliconflow: {
        apiKey: process.env.SILICONFLOW_API_KEY!,
        baseUrl: process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1',
        model: process.env.SILICONFLOW_MODEL || 'BAAI/bge-m3',
    },
};

// ============================================================
// 文件解析器
// ============================================================

/**
 * 解析 PDF 文件
 */
async function parsePdf(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const result = await pdfParse(dataBuffer);
    return result.text;
}

/**
 * 解析 Word 文档 (.docx)
 */
async function parseDocx(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
}

/**
 * 解析 Office 文档 (PPT only)
 * 注意：xlsx/xls 使用专门的 parseExcel 函数
 */
async function parseOffice(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        officeParser.parseOffice(filePath, (result: any, err: any) => {
            if (err) {
                reject(err);
            } else {
                // result 可能是 AST 对象或字符串
                const text = typeof result === 'string' ? result : (result?.text || JSON.stringify(result));
                resolve(text || '');
            }
        });
    });
}

/**
 * 解析 Excel 文件 (xls/xlsx)
 * 使用 xlsx 库，支持旧版 .xls 格式
 */
async function parseExcel(filePath: string): Promise<string> {
    const workbook = XLSX.readFile(filePath);
    let text = '';

    // 遍历所有工作表
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        // 转换为 CSV 格式文本
        const csv = XLSX.utils.sheet_to_csv(sheet);
        text += `[${sheetName}]\n${csv}\n\n`;
    }

    return text;
}

/**
 * 解析纯文本文件
 */
async function parseTxt(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, 'utf-8');
}

/**
 * 根据文件类型选择解析器
 */
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
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
        case 'webp':
            return parseImage(filePath);
        default:
            throw new Error(`Unsupported file type: ${ext}`);
    }
}

/**
 * 解析图片文件
 * 使用 DeepSeek-OCR 进行识别
 */
async function parseImage(filePath: string): Promise<string> {
    console.log(`[KnowledgeService] Processing image: ${filePath}`);
    try {
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');
        const text = await recognizePage(base64Image);
        return text;
    } catch (error: any) {
        console.error(`[KnowledgeService] OCR failed for image: ${error.message}`);
        throw error;
    }
}

// ============================================================
// 文本分片
// ============================================================

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];

    // 清理文本: 合并空白字符，但保留基本的可读性
    text = text.replace(/\s+/g, ' ').trim();

    // 如果清理后文本过短，直接返回空
    if (text.length < 10) {
        return [];
    }

    let start = 0;
    while (start < text.length) {
        let end = start + chunkSize;

        // 尝试在句子边界处切分
        if (end < text.length) {
            const lastPeriod = text.lastIndexOf('。', end);
            const lastQuestion = text.lastIndexOf('？', end);
            const lastExclaim = text.lastIndexOf('！', end);
            const lastDot = text.lastIndexOf('. ', end);

            const breakPoint = Math.max(lastPeriod, lastQuestion, lastExclaim, lastDot);
            // 只有当断点在当前切片的后半部分时才采用，避免切片太短
            if (breakPoint > start + chunkSize * 0.5) {
                end = breakPoint + 1;
            }
        }

        const chunk = text.slice(start, end).trim();
        if (chunk.length > 5) { // 放宽最小长度限制
            chunks.push(chunk);
        }

        start = end - overlap;
        if (start < 0) start = 0;
        if (start >= text.length) break;
    }

    return chunks;
}

// ============================================================
// Embedding 生成
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

// ============================================================
// 用户知识库服务
// ============================================================

export class UserKnowledgeService {

    /**
     * 创建文件记录
     */
    static async createFileRecord(
        userId: number,
        fileName: string,
        fileType: string,
        fileSize: number
    ): Promise<number> {
        const result = await getPool().query(
            `INSERT INTO user_knowledge_files (user_id, file_name, file_type, file_size, status)
             VALUES ($1, $2, $3, $4, 'parsing')
             RETURNING id`,
            [userId, fileName, fileType, fileSize]
        );
        return result.rows[0].id;
    }

    /**
     * 更新文件状态
     */
    static async updateFileStatus(
        fileId: number,
        status: string,
        chunkCount?: number,
        errorMessage?: string
    ): Promise<void> {
        if (chunkCount !== undefined) {
            await getPool().query(
                `UPDATE user_knowledge_files 
                 SET status = $1, chunk_count = $2, error_message = $3, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $4`,
                [status, chunkCount, errorMessage || null, fileId]
            );
        } else {
            await getPool().query(
                `UPDATE user_knowledge_files 
                 SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $3`,
                [status, errorMessage || null, fileId]
            );
        }
    }

    /**
     * 保存向量数据
     */
    static async saveEmbeddings(
        fileId: number,
        userId: number,
        chunks: string[],
        embeddings: number[][]
    ): Promise<void> {
        const client = await getPool().connect();
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
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * 处理上传的文件（异步）
     */
    static async processFile(
        fileId: number,
        userId: number,
        filePath: string,
        fileType: string
    ): Promise<void> {
        console.log(`[KnowledgeService] Processing file ${fileId}: ${filePath}`);

        try {
            // 1. 解析文件
            console.log(`[KnowledgeService] Parsing ${fileType} file...`);
            let text = await parseFile(filePath, fileType);
            const rawLength = text.replace(/\s+/g, '').length;
            console.log(`[KnowledgeService] Extracted ${text.length} characters (valid: ${rawLength})`);

            // 降级策略: OCR 处理 (Fallback: OCR Processing)
            if (fileType === 'pdf' && rawLength < 100) {
                console.log('[KnowledgeService] Valid text < 100 chars. Switching to DeepSeek-OCR...');
                await UserKnowledgeService.updateFileStatus(fileId, 'OCR识别中' as any);

                try {
                    const pdfBuffer = fs.readFileSync(filePath);
                    // 转换为图片 (150 DPI)
                    const imageBuffers = await convertPdfToImages(pdfBuffer, 150);
                    console.log(`[KnowledgeService] PDF converted to ${imageBuffers.length} images for OCR.`);

                    let ocrText = '';
                    for (let i = 0; i < imageBuffers.length; i++) {
                        try {
                            console.log(`[KnowledgeService] OCR processing page ${i + 1}/${imageBuffers.length}...`);
                            const pageBase64 = imageBuffers[i].toString('base64');
                            const pageText = await recognizePage(pageBase64);
                            ocrText += pageText + '\n\n';
                        } catch (err: any) {
                            console.error(`[KnowledgeService] OCR failed for page ${i + 1}: ${err.message}`);
                            // 继续处理下一页
                        }
                    }

                    if (ocrText.trim().length > 0) {
                        text = ocrText;
                        console.log(`[KnowledgeService] OCR completed. Extracted ${text.length} characters.`);
                    } else {
                        throw new Error('OCR failed to extract any text from the document.');
                    }

                } catch (ocrErr: any) {
                    console.error('[KnowledgeService] OCR Critical Failure:', ocrErr);
                    throw new Error(`OCR Processing Failed: ${ocrErr.message}`);
                }
            }

            // 2. 文本分片
            const chunks = chunkText(text, config.chunkSize, config.chunkOverlap);
            console.log(`[KnowledgeService] Split into ${chunks.length} chunks`);

            if (chunks.length === 0) {
                const snippet = text.length > 50 ? text.substring(0, 50) + '...' : text;
                throw new Error(`无法提取有效文本 (Length: ${text.length}). 这可能是扫描版PDF(图片)或加密文档. 内容预览: "${snippet}"`);
            }

            // 3. 生成 embeddings
            console.log(`[KnowledgeService] Generating embeddings...`);
            const embeddings: number[][] = [];
            for (let i = 0; i < chunks.length; i++) {
                const embedding = await getEmbedding(chunks[i]);
                embeddings.push(embedding);
                console.log(`[KnowledgeService] Embedded chunk ${i + 1}/${chunks.length}`);

                // Rate limiting: 每个请求间隔 200ms
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // 4. 保存到数据库
            await this.saveEmbeddings(fileId, userId, chunks, embeddings);

            // 5. 更新状态
            await this.updateFileStatus(fileId, 'completed', chunks.length);
            console.log(`[KnowledgeService] ✅ File ${fileId} processed successfully`);

            // 6. 删除本地文件以节省空间
            try {
                fs.unlinkSync(filePath);
                console.log(`[KnowledgeService] Deleted temp file: ${filePath}`);
            } catch (err) {
                console.warn(`[KnowledgeService] Failed to delete temp file: ${filePath}`);
            }

        } catch (error: any) {
            console.error(`[KnowledgeService] ❌ Error processing file ${fileId}:`, error.message);
            await this.updateFileStatus(fileId, 'failed', undefined, error.message);
        }
    }

    /**
     * 获取用户的文件列表
     */
    static async getUserFiles(userId: number): Promise<KnowledgeFile[]> {
        const result = await getPool().query(
            `SELECT * FROM user_knowledge_files 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    /**
     * 删除用户的文件
     */
    static async deleteFile(fileId: number, userId: number): Promise<boolean> {
        const result = await getPool().query(
            `DELETE FROM user_knowledge_files 
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [fileId, userId]
        );
        return result.rowCount !== null && result.rowCount > 0;
    }

    /**
     * 语义搜索用户知识库
     */
    static async search(userId: number, query: string, limit: number = 5): Promise<SearchResult[]> {
        try {
            const embedding = await getEmbedding(query);
            const embeddingStr = `[${embedding.join(',')}]`;

            const result = await getPool().query(
                `SELECT 
                    uke.file_id,
                    ukf.file_name,
                    uke.content,
                    1 - (uke.embedding <=> $1::vector) as similarity
                 FROM user_knowledge_embeddings uke
                 JOIN user_knowledge_files ukf ON ukf.id = uke.file_id
                 WHERE uke.user_id = $2
                   AND 1 - (uke.embedding <=> $1::vector) > 0.3
                 ORDER BY uke.embedding <=> $1::vector ASC
                 LIMIT $3`,
                [embeddingStr, userId, limit]
            );

            return result.rows.map((row: any) => ({
                file_id: row.file_id,
                file_name: row.file_name,
                content: row.content,
                similarity: parseFloat(row.similarity),
            }));

        } catch (error: any) {
            console.error('[KnowledgeService] Search error:', error.message);
            throw error;
        }
    }

    /**
     * 获取用户上传目录
     */
    static getUserUploadDir(userId: number): string {
        const userDir = path.join(config.uploadDir, String(userId));
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        return userDir;
    }
}
