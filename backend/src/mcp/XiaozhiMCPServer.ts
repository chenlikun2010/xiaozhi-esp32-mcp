import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebSocketClientTransport } from "./WebSocketClientTransport";
import { z } from "zod";
import { QwenSearchToolDefinition, handleQwenSearch } from "./tools/QwenSearchTool";

export class XiaozhiMCPServer {
    private server: McpServer;
    private transport: WebSocketClientTransport;
    private isConnected: boolean = false;

    constructor(wssUrl: string, serviceName: string = "Xiaozhi MCP Service") {
        this.server = new McpServer({
            name: serviceName,
            version: "1.0.0"
        });

        this.transport = new WebSocketClientTransport(wssUrl);

        // Define some default tools/capabilities
        this.setupDefaultTools();
    }

    private setupDefaultTools() {
        // Example: A simple echo tool to verify connectivity
        this.server.tool(
            "echo",
            { message: z.string() },
            async ({ message }) => {
                return {
                    content: [{ type: "text", text: `Echo: ${message}` }]
                };
            }
        );

        // Example: Get Server Time
        this.server.tool(
            "get_server_time",
            {},
            async () => {
                return {
                    content: [{ type: "text", text: new Date().toISOString() }]
                };
            }
        );

        // Qwen Internet Search Tool
        this.server.tool(
            QwenSearchToolDefinition.name,
            QwenSearchToolDefinition.schema,
            async (args) => {
                return await handleQwenSearch(args);
            }
        );
    }

    async connect() {
        if (this.isConnected) return;

        try {
            console.log("Connecting to Xiaozhi via WebSocket...");
            await this.server.connect(this.transport);
            this.isConnected = true;
            console.log("MCP Server Connected and Ready.");
        } catch (error) {
            console.error("Failed to connect MCP Server:", error);
            throw error;
        }
    }

    async disconnect() {
        if (!this.isConnected) return;

        try {
            await this.server.close();
            this.isConnected = false;
            console.log("MCP Server Disconnected.");
        } catch (error) {
            console.error("Error disconnecting MCP Server:", error);
        }
    }

    getStatus() {
        return {
            connected: this.isConnected
        };
    }
}
