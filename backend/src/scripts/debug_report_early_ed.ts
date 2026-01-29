import { ReportService } from '../services/ReportService';
import { Pool } from 'pg';
import 'dotenv/config';

// Temporary pool to just query the DB for "早教" related reports to see what we have
const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
});

const debugEarlyEd = async () => {
    try {
        console.log("=== Debugging Early Education Report Availability ===");

        // 1. Direct DB Search
        console.log("\n1. Direct SQL Search for '早教' in title:");
        const res = await pool.query(`SELECT id, title, word_url FROM ${process.env.POSTGRES_SCHEMA || 'mcp'}.reports WHERE title LIKE '%早教%' OR title LIKE '%教育%' LIMIT 5`);
        if (res.rows.length === 0) {
            console.warn("   [WARN] No reports found with '早教' or '教育' in title via SQL.");
        } else {
            console.log(`   Found ${res.rows.length} matches:`);
            res.rows.forEach(r => console.log(`   - [ID: ${r.id}] ${r.title}`));
        }

        // 2. Semantic Search
        const query = "早教行业报告";
        console.log(`\n2. ReportService.search("${query}"):`);
        const searchResults = await ReportService.search(query, 5);

        if (searchResults.length === 0) {
            console.error("   [FAIL] Semantic search returned 0 results.");
        } else {
            console.log(`   Found ${searchResults.length} results.`);
            searchResults.forEach(r => {
                console.log(`   - [ID: ${r.id}] Title: ${r.title} (Similarity: ${r.similarity})`);
            });
        }

        // 3. Test Full Content Fetch (if we found an ID)
        if (searchResults.length > 0) {
            const topReport = searchResults[0];
            console.log(`\n3. Fetching Content for Report ID: ${topReport.id} ("${topReport.title}")...`);

            const content = await ReportService.getReportContentById(topReport.id);
            console.log(`   Retrieved ${content.length} chunks.`);
            if (content.length === 0) {
                console.error("   [FAIL] getReportContentById returned 0 chunks. Parsing might have failed for this PDF.");
            } else {
                console.log("   [PASS] Content retrieved successfully.");
                console.log("   Preview:", content[0].content.substring(0, 100));
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await pool.end();
        process.exit(0);
    }
};

debugEarlyEd();
