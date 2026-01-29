import { ReportService } from '../services/ReportService';
import { Pool } from 'pg';
import 'dotenv/config';

// Temporary pool to list reports directly just to get a sample
const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
});

const debugReport = async () => {
    try {
        console.log("Listing 3 random reports...");
        const res = await pool.query(`SELECT id, title, word_url FROM ${process.env.POSTGRES_SCHEMA || 'mcp'}.reports ORDER BY id DESC LIMIT 3`);

        if (res.rows.length === 0) {
            console.log("No reports found in DB.");
            return;
        }

        const sampleReport = res.rows[0];
        console.log(`\nSelected Report: ${sampleReport.title} (ID: ${sampleReport.id})`);

        console.log(`\n--- Searching for Title: "${sampleReport.title}" ---`);
        const searchResults = await ReportService.search(sampleReport.title, 5);

        console.log(`Found ${searchResults.length} chunks.`);
        searchResults.forEach((r, i) => {
            console.log(`\nChunk [${i}]:`);
            console.log(`Title: ${r.title}`);
            console.log(`Similarity: ${r.similarity}`);
            console.log(`Content Preview: ${r.content.substring(0, 150)}...`);
        });

        // Test with specific report ID
        console.log(`\n--- Fetching Full Content for Report ID: ${sampleReport.id} ---`);
        const fullContentChunks = await ReportService.getReportContentById(sampleReport.id);
        console.log(`Found ${fullContentChunks.length} full content chunks.`);

        // Test with a question using specific report context
        const query = `Summarize the report "${sampleReport.title}"`;
        console.log(`\n--- Generating Answer for: "${query}" using Full Content ---`);
        // Limit context to prevent token overflow if report is huge (e.g. max 20 chunks)
        const answer = await ReportService.generateAnswer(query, fullContentChunks.slice(0, 20));
        console.log("\nAnswer:");
        console.log(answer);

    } catch (e: any) {
        console.error("Error:", e);
    } finally {
        await pool.end();
        process.exit(0);
    }
};

debugReport();
