
import { XiaozhiMCPServer } from "./mcp/XiaozhiMCPServer";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

async function verifyFlightService() {
    console.log("Verifying Variflight Service Integration...");

    // Initialize Server with "Variflight Service" name to trigger tool registration
    const server = new XiaozhiMCPServer("ws://localhost:8080", "Xiaozhi MCP Service with Variflight");

    // Mock the handling to see if tools are registered
    // We can't easily inspect private server tools without casting to any, 
    // but we can try to find the tool in the registered list if we could access it.
    // Instead, we will rely on the logs from `XiaozhiMCPServer` which logs "Registering tool: ..."

    console.log("Waiting for tool registration (5 seconds)...");

    // We need to actually keep the process alive to let the async registration happen
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("Verification finished. Check logs for '[StdioMCP] Registering tool...' messages.");
    console.log("If tools are registered, the integration is successful.");

    // Clean up
    await server.disconnect();
}

verifyFlightService().catch(console.error);
