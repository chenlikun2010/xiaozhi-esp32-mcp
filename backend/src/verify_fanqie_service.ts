
import { XiaozhiMCPServer } from "./mcp/XiaozhiMCPServer";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

async function verifyFanqieService() {
    console.log("Verifying Fanqie Service Integration...");

    const server = new XiaozhiMCPServer("ws://localhost:8080", "Fanqie Novel Service");

    console.log("Waiting for tool registration (5 seconds)...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("Check logs above for '[StdioMCP] Registering tool: search_book' or similar.");

    await server.disconnect();
}

verifyFanqieService().catch(console.error);
