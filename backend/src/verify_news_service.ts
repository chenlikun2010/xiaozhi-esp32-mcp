
import { XiaozhiMCPServer } from "./mcp/XiaozhiMCPServer";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

async function verifyNewsService() {
    console.log("Verifying News Service Integration...");

    const server = new XiaozhiMCPServer("ws://localhost:8080", "The Verge News Service");

    console.log("Waiting for tool registration (5 seconds)...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // We can't directly inspect private tools, but we can check logs.
    // Ideally we should proxy a client to testing it, but XiaozhiMCPServer wraps it.
    // For manual verification, we can try to connect a fake client to this server if we exposed it, 
    // but here we primarily check if the process didn't crash and logged tool registration.

    // To truly verify, we'd need to mock the websocket or just check log output for "[StdioMCP] Registering tool: get-daily-news"

    console.log("Check logs above for '[StdioMCP] Registering tool: get-daily-news'.");

    await server.disconnect();
}

verifyNewsService().catch(console.error);
