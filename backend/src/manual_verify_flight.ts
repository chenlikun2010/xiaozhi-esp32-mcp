
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

async function verifyFlight() {
    const apiKey = process.env.VARIFLIGHT_API_KEY;
    if (!apiKey) {
        console.error("VARIFLIGHT_API_KEY not found in .env");
        process.exit(1);
    }
    console.log("Using API Key:", apiKey.substring(0, 5) + "...");

    console.log("Connecting to Variflight MCP...");

    // Use the same command as in XiaozhiMCPServer
    const transport = new StdioClientTransport({
        command: "node",
        args: ["node_modules/.bin/variflight-mcp"],
        env: { ...process.env, VARIFLIGHT_API_KEY: apiKey }
    });

    const client = new Client({
        name: "ManualVerification",
        version: "1.0.0"
    }, {
        capabilities: {}
    });

    try {
        await client.connect(transport);
        console.log("Connected.");

        const tools = await client.listTools();
        console.log("Available tools:", tools.tools.map(t => t.name).join(", "));

        const validTools = tools.tools;
        const flightTool = validTools.find(t => t.name === "searchFlightsByNumber");
        if (flightTool) {
            console.log("Tool Schema for searchFlightsByNumber:", JSON.stringify(flightTool.inputSchema, null, 2));
        }

        console.log("\nSearching for flight CA1955...");

        // User requested Feb 9th. Assuming 2026 based on previous context.
        const dateStr = "2026-02-09";
        console.log(`Using date: ${dateStr}`);

        const result = await client.callTool({
            name: "searchFlightsByNumber",
            arguments: {
                fnum: "CA1955",
                date: dateStr
            }
        });

        console.log("\n--- Flight Result ---");
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error("Error verifying flight:", error);
    } finally {
        // client.close(); 
        process.exit(0);
    }
}

verifyFlight();
