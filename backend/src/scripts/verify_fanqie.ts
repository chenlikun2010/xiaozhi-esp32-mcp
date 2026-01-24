
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

async function verifyDirectFanqie() {
    console.log("Verifying Fanqie Service (Direct Stdio)...");

    const command = "node";
    const scriptPath = path.join(__dirname, "../services/mcp-server-fanqie/build/index.js");
    const args = [scriptPath];

    console.log(`Command: ${command} ${args.join(" ")}`);

    try {
        const transport = new StdioClientTransport({
            command,
            args,
            env: { ...process.env } as Record<string, string>
        });

        const client = new Client({
            name: "TestClient",
            version: "1.0.0"
        }, {
            capabilities: {}
        });

        console.log("Connecting...");
        await client.connect(transport);
        console.log("Connected!");

        console.log("Listing tools...");
        const result = await client.listTools();
        console.log("Tools found:", JSON.stringify(result.tools.map(t => ({ name: t.name, schema: t.inputSchema })), null, 2));

        const searchTool = result.tools.find(t => t.name.includes("search") || t.name.includes("query"));
        if (!searchTool) {
            console.error("No search tool found!");
            return;
        }

        console.log(`Calling tool: ${searchTool.name} with query '修仙'`);
        const callResult = await client.callTool({
            name: searchTool.name,
            arguments: {
                key: "修仙",
                page_size: 5,
                page: 1
            }
        });

        console.log("Result:", JSON.stringify(callResult, null, 2));

        await transport.close();
    } catch (error) {
        console.error("Verification failed:", error);
    }
}

verifyDirectFanqie();
