import { handleSearchReports } from './tools/ReportSearchTool';
import 'dotenv/config';

// TDD Script for Search Reports ID Visibility
const testSearchReportsTDD = async () => {
    try {
        console.log("=== TDD: Testing Search Reports Output ===");
        const query = "最新海验报告"; // Use the query from user logs

        console.log(`Searching for: "${query}"...`);
        const result = await handleSearchReports({ query });

        // Check if result has content
        if (!result.content || result.content.length === 0) {
            console.error("FAIL: No result returned.");
            return;
        }

        const textOutput = result.content[0].text;
        console.log("\n--- Search Tool Output Payload ---");
        console.log(textOutput.substring(0, 500) + "...");

        // Assertion: Output MUST contain "ID:" for the AI to pick it up
        if (textOutput.includes('ID:')) {
            console.log("\nPASS: Output includes Report IDs.");
        } else {
            console.error("\nFAIL: Output does NOT include Report IDs. The AI cannot request details.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit(0);
    }
};

testSearchReportsTDD();
