
import { ReportService } from "../services/ReportService";

async function main() {
    try {
        const query = "2026年全球趋势";
        console.log(`Searching for: "${query}"...`);

        const results = await ReportService.search(query);

        console.log(`Found ${results.length} results:`);
        results.forEach((r, i) => {
            console.log(`\n[${i + 1}] ${r.title}`);
            console.log(`    Similarity: ${r.similarity}`);
            console.log(`    Date: ${r.publish_time}`);
            console.log(`    Snippet: ${r.content.substring(0, 100)}...`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

main();
