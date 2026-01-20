import { z } from "zod";
import { Pool } from 'pg';
import axios from 'axios';

// PostgreSQL 连接配置
const pool = new Pool({
    host: process.env.POSTGRES_HOST!,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DB!,
    max: 10,
    idleTimeoutMillis: 30000,
});

pool.on('connect', (client: any) => {
    const schema = process.env.POSTGRES_SCHEMA || 'mcp';
    client.query(`SET search_path TO ${schema}, public`);
});

// SiliconFlow 配置
const siliconflowConfig = {
    apiKey: process.env.SILICONFLOW_API_KEY!,
    baseUrl: process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1',
    model: process.env.SILICONFLOW_MODEL || 'BAAI/bge-m3',
};

// ============================================================
// 工具定义
// ============================================================

export const PrivateDocsSearchDefinition = {
    name: "search_private_docs",
    description: "检索用户上传的私人文档内容以回答问题。Search user's private uploaded documents to answer questions.",
    schema: {
        query: z.string().describe("用户的问题或搜索内容 (The user's question or search query)"),
    }
};

// ============================================================
// Embedding 生成
// ============================================================

async function getEmbedding(text: string): Promise<number[]> {
    const response = await axios.post(
        `${siliconflowConfig.baseUrl}/embeddings`,
        {
            model: siliconflowConfig.model,
            input: text,
            encoding_format: 'float',
        },
        {
            headers: {
                'Authorization': `Bearer ${siliconflowConfig.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 20000,
        }
    );

    const data = response.data as any;
    if (data.data && data.data.length > 0) {
        return data.data[0].embedding;
    }
    throw new Error('No embedding returned from API');
}

// ============================================================
// 向量检索
// ============================================================

interface SearchResult {
    file_name: string;
    content: string;
    similarity: number;
}

async function searchUserKnowledge(userId: number, query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
        // 1. 将查询转为向量
        console.log(`[PrivateDocs] Generating embedding for query...`);
        const embedding = await getEmbedding(query);
        const embeddingStr = `[${embedding.join(',')}]`;

        // 2. 执行向量检索 (利用 HNSW 索引)
        console.log(`[PrivateDocs] Searching user ${userId}'s knowledge base...`);
        const sql = `
            SELECT 
                ukf.file_name,
                uke.content,
                1 - (uke.embedding <=> $1::vector) as similarity
            FROM user_knowledge_embeddings uke
            JOIN user_knowledge_files ukf ON ukf.id = uke.file_id
            WHERE uke.user_id = $2
              AND 1 - (uke.embedding <=> $1::vector) > 0.3
            ORDER BY uke.embedding <=> $1::vector ASC
            LIMIT $3
        `;

        const result = await pool.query(sql, [embeddingStr, userId, limit]);
        console.log(`[PrivateDocs] Found ${result.rows.length} results`);

        return result.rows.map((row: any) => ({
            file_name: row.file_name,
            content: row.content,
            similarity: parseFloat(row.similarity),
        }));

    } catch (error: any) {
        console.error('[PrivateDocs] Search error:', error.message);
        throw error;
    }
}

// ============================================================
// 工具处理器
// ============================================================

export async function handlePrivateDocsSearch(args: any, userId: number) {
    const { query } = args;

    if (!userId) {
        return {
            content: [{
                type: "text",
                text: "无法识别用户身份，请确保您已登录。(Unable to identify user. Please make sure you are logged in.)"
            }],
            isError: true
        };
    }

    try {
        console.log(`[PrivateDocs] User ${userId} searching: "${query}"`);

        // 执行向量检索
        const results = await searchUserKnowledge(userId, query, 5);

        // 如果有结果，格式化返回
        if (results.length > 0) {
            const formattedContent = results.map((r, i) =>
                `【来源: ${r.file_name}】\n${r.content}`
            ).join('\n\n---\n\n');

            return {
                content: [{
                    type: "text",
                    text: `从您的知识库中为您找到以下相关信息：\n\n${formattedContent}`
                }]
            };
        }

        // 没有结果
        return {
            content: [{
                type: "text",
                text: "未在您的个人知识库中找到相关答案。请尝试上传更多相关文档，或换一种方式提问。"
            }]
        };

    } catch (error: any) {
        console.error(`[PrivateDocs] Error:`, error);
        return {
            content: [{
                type: "text",
                text: `检索知识库时发生错误: ${error.message}`
            }],
            isError: true
        };
    }
}
