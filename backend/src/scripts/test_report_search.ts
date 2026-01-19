// Quick test for Report Search functionality
import 'dotenv/config';
import { ReportService } from '../services/ReportService';

async function main() {
    const query = '2026年世界经济展望';
    console.log(`\n=== Testing Report Search ===`);
    console.log(`Query: "${query}"\n`);

    try {
        const results = await ReportService.search(query, 3);

        if (results.length === 0) {
            console.log('No results found.');
        } else {
            console.log(`Found ${results.length} results:\n`);
            results.forEach((r, i) => {
                console.log(`[${i + 1}] ${r.title}`);
                console.log(`    Similarity: ${(r.similarity * 100).toFixed(2)}%`);
                console.log(`    URL: ${r.word_url}`);
                console.log(`    Content preview: ${r.content?.substring(0, 100)}...`);
                console.log('');
            });
        }

        // Test answer generation if results found
        if (results.length > 0) {
            console.log(`\n=== Testing Answer Generation ===\n`);
            const answer = await ReportService.generateAnswer(query, results);
            console.log('Generated Answer:');
            console.log(answer);
        }

    } catch (error: any) {
        console.error('Test failed:', error.message);
    }

    process.exit(0);
}

main();
