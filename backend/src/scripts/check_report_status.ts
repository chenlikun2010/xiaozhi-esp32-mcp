import { Pool } from 'pg';
import 'dotenv/config';

// Script to check and reset report vectorization status
const checkAndResetReport = async () => {
    // Arg 1: Report ID or Keyword
    const target = process.argv[2];
    const reset = process.argv.includes('--reset');

    if (!target) {
        console.error("Usage: npx ts-node src/scripts/check_report_status.ts <reportId|keyword> [--reset]");
        process.exit(1);
    }

    const pool = new Pool({
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
    });

    try {
        await pool.query(`SET search_path TO ${process.env.POSTGRES_SCHEMA || 'mcp'}, public`);

        // 1. Find the report
        let report;
        if (!isNaN(parseInt(target))) {
            const res = await pool.query('SELECT * FROM reports WHERE id = $1', [target]);
            report = res.rows[0];
        } else {
            const res = await pool.query('SELECT * FROM reports WHERE title ILIKE $1 LIMIT 1', [`%${target}%`]);
            report = res.rows[0];
        }

        if (!report) {
            console.error(`Status: [Not Found] Report matching "${target}" not found.`);
            return;
        }

        console.log(`\n=== Report Analysis: ${report.title} (ID: ${report.id}) ===`);
        console.log(`Current Status: ${report.status}`);
        console.log(`URL: ${report.word_url}`);
        console.log(`Publish Time: ${report.publish_time}`);

        // 2. Check Embeddings
        const embRes = await pool.query('SELECT count(*) as count FROM report_embeddings WHERE report_id = $1', [report.id]);
        const chunkCount = parseInt(embRes.rows[0].count);
        console.log(`Vector Chunks: ${chunkCount}`);

        // 3. Analysis
        let needsReset = false;
        if (chunkCount === 0) {
            console.warn(`[WARN] No vector embeddings found! Search will fail.`);
            needsReset = true;
        } else if (report.status !== 'completed' && report.status !== 'pending' && report.status !== 'processing') {
            console.warn(`[WARN] Status is '${report.status}', which might be an error state.`);
            needsReset = true;
        } else {
            console.log(`[PASS] Report appears to be properly vectorized.`);
        }

        // 4. Reset Action
        if (reset) {
            console.log(`\n[ACTION] Resetting status to 'pending' to trigger re-vectorization...`);
            await pool.query("UPDATE reports SET status = 'pending', local_path = NULL WHERE id = $1", [report.id]);
            // Also clear existing embeddings to be clean
            await pool.query("DELETE FROM report_embeddings WHERE report_id = $1", [report.id]);
            console.log(`[DONE] Report queued. The worker will pick it up shortly.`);
        } else if (needsReset) {
            console.log(`\n[TIP] Run with --reset to fix this report.`);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
};

checkAndResetReport();
