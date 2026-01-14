import dotenv from 'dotenv';
dotenv.config();

import { handleQwenSearch } from "./tools/QwenSearchTool";

async function testSearch() {
    console.log("Testing Qwen Search Tool...");
    const query = "What is the capital of France?";
    console.log(`Query: ${query}`);

    try {
        const result = await handleQwenSearch({ query });
        if (result.isError) {
            console.error("Search failed:", result.content[0].text);
        } else {
            console.log("Search Result:");
            console.log(result.content[0].text);
        }
    } catch (error) {
        console.error("Test execution failed:", error);
    }
}

testSearch();
