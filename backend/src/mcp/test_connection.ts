import dotenv from 'dotenv';
dotenv.config();

import { XiaozhiMCPServer } from "./XiaozhiMCPServer";
import { handleQwenSearch } from "./tools/QwenSearchTool";

const WSS_URL = "wss://api.nocode.cd/mcp/?token=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE5ODE1NywiYWdlbnRJZCI6NzU5NDQwLCJlbmRwb2ludElkIjoiYWdlbnRfNzU5NDQwIiwicHVycG9zZSI6Im1jcC1lbmRwb2ludCIsImlhdCI6MTc2ODM3NDM3NCwiZXhwIjoxNzk5OTMxOTc0fQ.jiUyx84ZKMThe2CzkwkiZP6HwoD3wlVJO4UBmLmFRlyu2_gm_QgSmJhtcywR2m2pgPqObcFwOvA7zNWE9WW6dg";

async function testConnection() {
    console.log("=== Testing 1: Local Search Tool Logic ===");
    try {
        const result = await handleQwenSearch({ query: "Hello world" });
        if (result.isError) {
            console.error("Local Search Tool Test Failed:", result.content[0].text);
        } else {
            console.log("Local Search Tool Test Success!");
            console.log("Sample Output:", result.content[0].text.substring(0, 50) + "...");
        }
    } catch (err) {
        console.error("Local Search Tool Exception:", err);
    }

    console.log("\n=== Testing 2: WebSocket Connection to Xiaozhi ===");
    const server = new XiaozhiMCPServer(WSS_URL);

    try {
        await server.connect();

        const status = server.getStatus();
        if (status.connected) {
            console.log("Successfully connected to Xiaozhi MCP Endpoint!");
            console.log("Keeping connection alive for 5 seconds to verify stability...");
            await new Promise(resolve => setTimeout(resolve, 5000));
            console.log("Connection stable.");
        } else {
            console.error("Failed to connect: Status is disconnected.");
        }
    } catch (error) {
        console.error("Connection Error:", error);
    } finally {
        await server.disconnect();
    }
}

testConnection();
