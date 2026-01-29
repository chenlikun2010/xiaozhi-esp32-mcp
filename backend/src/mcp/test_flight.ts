import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const testFlight = async () => {
    console.log("Testing Variflight MCP...");

    const apiKey = process.env.VARIFLIGHT_API_KEY;
    if (!apiKey) {
        console.error("VARIFLIGHT_API_KEY not found!");
        return;
    }

    const command = "node";
    const args = ["node_modules/.bin/variflight-mcp"];
    const env = { ...process.env, VARIFLIGHT_API_KEY: apiKey } as Record<string, string>;

    console.log(`Command: ${command} ${args.join(" ")}`);

    try {
        const transport = new StdioClientTransport({
            command,
            args,
            env
        });

        const client = new Client({
            name: "TestFlightClient",
            version: "1.0.0"
        }, {
            capabilities: {}
        });

        console.log("Connecting...");
        await client.connect(transport);
        console.log("Connected.");

        console.log("Listing tools...");
        const tools = await client.listTools();
        console.log("Tools found:", JSON.stringify(tools, null, 2));

        // Test flight status query
        const flightNum = "CA1234"; // Example flight
        console.log(`\n--- Testing get_flight_status_by_flight_num (${flightNum}) ---`);

        // Need to find tool definition to know args
        // Assuming get_flight_status_by_flight_num based on typical naming or search

        // Let's call a tool if it exists
        const toolName = "searchFlightsByNumber";
        if (tools.tools.find(t => t.name === toolName)) {
            try {
                const result = await client.callTool({
                    name: toolName,
                    arguments: {
                        fnum: "CA1234",
                        date: new Date().toISOString().split('T')[0] // Today
                    }
                });
                if (result.isError) {
                    console.error("Result Error:", JSON.stringify(result, null, 2));
                } else {
                    console.log("Result Success!");
                    // console.log("Result:", JSON.stringify(result, null, 2));
                    const content = (result as any).content[0].text;
                    console.log("Content Preview:", content.substring(0, 200));
                }
            } catch (e: any) {
                console.error("Tool call failed:", e);
                // Print stdout/stderr if captured? stdio transport doesn't expose it easily here 
                // but the error might contain info.
            }
        } else {
            console.log(`Tool ${toolName} not found.`);
        }

        // Test airport tool
        /*
        const airportTool = "get_flight_board_list";
         if (tools.tools.find(t => t.name === airportTool)) {
            // ...
        }
        */

    } catch (error) {
        console.error("Test execution failed:", error);
    }
};

testFlight();
