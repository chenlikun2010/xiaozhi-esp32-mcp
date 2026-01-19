
import { ReportService } from "../services/ReportService";

async function main() {
    try {
        console.log("=== Test 1: Known Topic (2026 Economy) ===");
        const query1 = "2026年世界经济展望";
        console.log(`Query: "${query1}"`);

        // 1. Search DB
        const results1 = await ReportService.search(query1, 5);
        if (results1.length > 0) {
            console.log(`Found ${results1.length} local results.`);
            // 2. Generate Answer
            console.log("Generating answer...");
            const answer1 = await ReportService.generateAnswer(query1, results1);
            console.log("\n[Expert Answer]:\n", answer1);
        } else {
            console.log("No local results found (unexpected for this test).");
        }

        console.log("\n=== Test 2: Unknown Topic (Fallback Logic) ===");
        const query2 = "量子计算 2025";
        console.log(`Query: "${query2}"`);

        const results2 = await ReportService.search(query2, 5);
        if (results2.length === 0) {
            console.log("No local results. Triggering external search...");
            const added = await ReportService.searchExternal(query2);
            console.log(`External Search Result: Added ${added} new reports.`);
        } else {
            console.log(`Found ${results2.length} local results (maybe already fetched).`);
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

main();
