import { ReportService } from '../services/ReportService';
import 'dotenv/config';

// Script to debug ReportService timeout and context handling
const debugReportTimeout = async () => {
    try {
        console.log("=== Debugging Report Generation Timeout & Context ===");

        // 1. Mock a large context to simulate the user's scenario
        console.log("Generating large mock context...");
        const mockContext = Array.from({ length: 100 }, (_, i) => ({
            id: i,
            title: `Mock Report Chunk ${i}`,
            word_url: `http://example.com/report_${i}.pdf`,
            content: `This is a simulated large content chunk for testing purposes. `.repeat(10), // ~600 chars per chunk
            publish_time: new Date(),
            similarity: 0.95
        }));

        console.log(`Mock context created: ${mockContext.length} chunks.`);

        // 2. Call generateAnswer (Note: This will actually call SiliconFlow API, costing money/tokens)
        // We want to verify two things:
        // A) Does it handle the large context (or truncate it)?
        // B) Does it timeout? (We can't easily force a timeout, but we can check if it succeeds)

        // Use a simpler query to speed it up if it works
        const query = "Summarize this large mock context.";

        console.log("Calling ReportService.generateAnswer...");
        const startTime = Date.now();

        // Since generateAnswer is static, we can call it. 
        // We expect it to internally truncate or handle the 100 chunks.
        const answer = await ReportService.generateAnswer(query, mockContext);

        const duration = (Date.now() - startTime) / 1000;
        console.log(`\n[PASS] Generation successful in ${duration.toFixed(2)}s.`);
        console.log(`Answer preview: ${answer.substring(0, 100)}...`);

    } catch (error: any) {
        console.error(`\n[FAIL] Generation failed: ${error.message}`);
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            console.error("Confirmed TIMEOUT issue.");
        }
    } finally {
        process.exit(0);
    }
};

debugReportTimeout();
