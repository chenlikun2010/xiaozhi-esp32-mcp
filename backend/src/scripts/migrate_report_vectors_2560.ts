
import axios from 'axios';
import { Pool } from 'pg';
import 'dotenv/config';

const config = {
    postgres: {
        host: process.env.POSTGRES_HOST!,
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        user: process.env.POSTGRES_USER!,
        password: process.env.POSTGRES_PASSWORD!,
        database: process.env.POSTGRES_DB!,
        schema: process.env.POSTGRES_SCHEMA || 'mcp',
    },
    siliconflow: {
        apiKey: process.env.SILICONFLOW_API_KEY!,
        baseUrl: process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1',
        model: process.env.SILICONFLOW_MODEL || 'Qwen/Qwen3-Embedding-4B',
    }
};

const pool = new Pool({
    host: config.postgres.host,
    port: config.postgres.port,
    user: config.postgres.user,
    password: config.postgres.password,
    database: config.postgres.database,
});

pool.on('connect', (client: any) => {
    client.query(`SET search_path TO ${config.postgres.schema}, public`);
});

async function getEmbedding(text: string): Promise<number[]> {
    try {
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

        if (response.data && response.data.data && response.data.data.length > 0) {
            return response.data.data[0].embedding;
        }
        throw new Error('No embedding returned');
    } catch (error: any) {
        console.error('API Error:', error.message);
        throw error;
    }
}

async function migrate() {
    console.log("Starting migration to 2560 dimensions...");
    console.log("Target Model:", config.siliconflow.model);

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Drop Index
        console.log("Dropping existing HNSW index (if any)...");
        await client.query('DROP INDEX IF EXISTS report_embeddings_embedding_idx');

        // 2. Check current dimension. If 2560, we assume column is ready but maybe data is null/1024?
        // Actually, we can just force alter.
        // But if we alter from 1024 to 2560, we MUST convert existing data or set to NULL.
        // "USING NULL" sets all values to NULL.
        console.log("Altering column to vector(2560)... (This will reset embeddings to NULL)");
        try {
            await client.query('ALTER TABLE report_embeddings ALTER COLUMN embedding TYPE vector(2560) USING NULL');
        } catch (e: any) {
            console.error("Alter failed (maybe already 2560 but check data?):", e.message);
            // If it fails, maybe assume it's already done?
        }

        await client.query('COMMIT');

        // 3. Re-Embed
        console.log("Fetching rows to re-embed...");
        const res = await pool.query('SELECT id, content FROM report_embeddings WHERE embedding IS NULL');

        const total = res.rows.length;
        console.log(`Found ${total} rows needing embeddings.`);

        let successCount = 0;

        for (let i = 0; i < total; i++) {
            const row = res.rows[i];
            const content = row.content;

            if (!content || content.trim().length === 0) {
                console.warn(`Skipping row ${row.id} (empty content)`);
                continue;
            }

            try {
                process.stdout.write(`Embedding ${i + 1}/${total} (ID: ${row.id})... `);
                const embedding = await getEmbedding(content);
                const desc = `[${embedding.join(',')}]`;

                await pool.query('UPDATE report_embeddings SET embedding = $1::vector WHERE id = $2', [desc, row.id]);
                process.stdout.write("Done.\n");
                successCount++;

                // Rate limit slightly
                await new Promise(r => setTimeout(r, 200));

            } catch (err: any) {
                process.stdout.write(`Failed: ${err.message}\n`);
            }
        }

        console.log(`\nMigration Complete. Updated ${successCount}/${total} rows.`);

    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error("Migration Aborted:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
