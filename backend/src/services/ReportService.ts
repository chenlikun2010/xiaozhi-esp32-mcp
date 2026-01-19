import { Pool } from 'pg';
import axios from 'axios';
import 'dotenv/config';

// Reusing configuration from environment variables
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
};

// PostgreSQL Connection Pool
const pool = new Pool({
    host: config.postgres.host,
    port: config.postgres.port,
    user: config.postgres.user,
    password: config.postgres.password,
    database: config.postgres.database,
    max: 10, // Lower max connections for the service compared to worker
    idleTimeoutMillis: 30000,
});

pool.on('connect', (client: any) => {
    client.query(`SET search_path TO ${config.postgres.schema}, public`);
});

interface EmbeddingResponse {
    data: Array<{
        embedding: number[];
        index: number;
    }>;
}

export interface SearchResult {
    id: number;
    title: string;
    word_url: string;
    content: string;
    similarity: number;
    publish_time: Date | null;
}

export class ReportService {
    /**
     * Get embedding for a query string
     */
    private static async getEmbedding(text: string): Promise<number[]> {
        try {
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
                    timeout: 20000,
                }
            );

            if (response.data.data && response.data.data.length > 0) {
                return response.data.data[0].embedding;
            }
            throw new Error('No embedding returned from API');
        } catch (error: any) {
            console.error('[ReportService] Error getting embedding:', error.message);
            throw error;
        }
    }

    /**
     * Search reports by semantic similarity
     */
    public static async search(query: string, limit: number = 5): Promise<SearchResult[]> {
        try {
            // 1. Get embedding for the query
            const embedding = await this.getEmbedding(query);
            const embeddingStr = `[${embedding.join(',')}]`;

            // 2. Perform vector search in PostgreSQL
            // We join with the reports I explicitly to get metadata
            // Using <=> operator for cosine distance (smaller is better/more similar)
            // But usually we want similarity score (1 - distance)
            const sql = `
                SELECT 
                    r.id, 
                    r.title, 
                    r.word_url, 
                    re.content, 
                    r.publish_time,
                    1 - (re.embedding <=> $1::vector) as similarity
                FROM report_embeddings re
                JOIN reports r ON r.id = re.report_id
                WHERE 1 - (re.embedding <=> $1::vector) > 0.3  -- Similarity threshold
                ORDER BY re.embedding <=> $1::vector ASC
                LIMIT $2
            `;

            const result = await pool.query(sql, [embeddingStr, limit]);

            return result.rows.map((row: any) => ({
                id: row.id,
                title: row.title,
                word_url: row.word_url,
                content: row.content,
                similarity: parseFloat(row.similarity),
                publish_time: row.publish_time
            }));

        } catch (error: any) {
            console.error('[ReportService] Search error:', error);
            throw error;
        }
    }
    /**
     * Search external API for reports and add to database
     * Returns the number of new reports added
     */
    public static async searchExternal(keyword: string): Promise<number> {
        try {
            console.log(`[ReportService] Searching external API for: ${keyword}`);
            const response = await axios.post(
                'https://m.fckvip.cn/api/words/getWords',
                {},
                {
                    params: {
                        pageSize: 5, // Fetch top 5 relevant
                        keyword: keyword
                    },
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            // Using type assertion for response.data
            const result = response.data as any;

            if (result.result !== 200 || !result.data?.list) {
                console.warn('[ReportService] External API returned no valid data');
                return 0;
            }

            const words = result.data.list;
            let addedCount = 0;

            for (const word of words) {
                try {
                    // Check if exists
                    const exists = await pool.query('SELECT id FROM reports WHERE word_url = $1', [word.wordUrl]);
                    if (exists.rows.length === 0) {
                        const publishTime = word.publishTime ? new Date(word.publishTime) : new Date();
                        await pool.query(
                            `INSERT INTO reports (title, word_url, publish_time, status, device_id) 
                             VALUES ($1, $2, $3, 'pending', 'report_expert')`,
                            [word.title, word.wordUrl, publishTime]
                        );
                        addedCount++;
                        console.log(`[ReportService] Added new report to queue: ${word.title}`);
                    }
                } catch (err) {
                    // Ignore duplicates or errors
                    console.error('[ReportService] Error adding report:', err);
                }
            }
            return addedCount;

        } catch (error: any) {
            console.error('[ReportService] External search failed:', error.message);
            return 0;
        }
    }

    /**
     * Generate answer using SiliconFlow LLM
     */
    public static async generateAnswer(query: string, context: SearchResult[]): Promise<string> {
        try {
            const contextText = context.map((r, i) =>
                `[${i + 1}] Title: ${r.title}\n   Date: ${r.publish_time}\n   URL: ${r.word_url}\n   Content: ${r.content}`
            ).join('\n\n');

            const prompt = `You are an expert industry analyst (report_expert). 
User Query: "${query}"

Here is the relevant context from our report database:
${contextText}

Please summarize the information to answer the user's query. 
- If the context contains the answer, verify the details and provide a comprehensive summary.
- If the user asks for a specific report or wants to read the full content, ALWAYS provide the "URL" link from the context.
- Cite the report titles as sources e.g. [1].
- If the context is not sufficient, admit it.
- Answer in Chinese (Standard Mandarin).`;

            const response = await axios.post(
                `${config.siliconflow.baseUrl}/chat/completions`,
                {
                    model: "Qwen/Qwen2.5-72B-Instruct", // Use a high-quality model
                    messages: [
                        { role: "system", content: "You are a helpful assistant." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                },
                {
                    headers: {
                        'Authorization': `Bearer ${config.siliconflow.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30s timeout for generation
                }
            );

            const data = response.data as any;
            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content;
            }
            return "Sorry, I couldn't generate an answer at this time.";

        } catch (error: any) {
            console.error('[ReportService] LLM generation failed:', error.message);
            return `Error generating answer: ${error.message}`;
        }
    }
}
