import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebSocketClientTransport } from "./WebSocketClientTransport";
import { z } from "zod";
import { QwenSearchToolDefinition, handleQwenSearch } from "./tools/QwenSearchTool";
import { HowToCookToolDefinition, handleHowToCook } from "./tools/HowToCookTool";
import { StartMbtiTestDefinition, AnswerQuestionDefinition, CalculateMbtiResultDefinition, handleStartMbtiTest, handleAnswerQuestion, handleCalculateResult } from "./tools/MbtiTool";
import { GetStockQuoteDefinition, GetStockHistoryDefinition, handleGetStockQuote, handleGetStockHistory } from "./tools/StockTool";
import { GetExchangeRateDefinition, ConvertCurrencyDefinition, handleGetExchangeRate, handleConvertCurrency } from "./tools/ExchangeRateTool";
import { SearchTrainTicketsDefinition, handleSearchTrainTickets } from "./tools/TrainTicketTool";
import { GetGoldPriceDefinition, handleGetGoldPrice } from "./tools/GoldPriceTool";
import { SearchReportsDefinition, handleSearchReports } from "./tools/ReportSearchTool";
import { ReportExpertDefinition, handleReportExpert } from "./tools/ReportExpertTool";
import { PrivateDocsSearchDefinition, handlePrivateDocsSearch } from "./tools/PrivateDocsSearchTool";
import { GetExpressInfoDefinition, handleGetExpressInfo } from "./tools/Kuaidi100Tool";

export class XiaozhiMCPServer {
    private server: McpServer;
    private transport: WebSocketClientTransport;
    private isConnected: boolean = false;
    private serviceName: string;
    private checkExpiry?: () => Promise<boolean>;
    private userId?: number;
    private stdioClients: Client[] = [];

    constructor(wssUrl: string, serviceName: string = "Xiaozhi MCP Service", checkExpiry?: () => Promise<boolean>, userId?: number) {
        this.server = new McpServer({
            name: serviceName,
            version: "1.0.0"
        });
        this.serviceName = serviceName;
        this.checkExpiry = checkExpiry;
        this.userId = userId;

        this.transport = new WebSocketClientTransport(wssUrl);
    }

    private async wrapHandler(handler: (args: any) => Promise<any>, args: any, toolName: string) {
        console.log(`[MCP] Request ${toolName} args:`, JSON.stringify(args));
        if (this.checkExpiry) {
            const isExpired = await this.checkExpiry();
            if (isExpired) {
                console.log(`[MCP] User expired. Blocking ${toolName}`);
                return {
                    content: [{
                        type: "text",
                        text: "Service Expired. Please contact customer service to purchase activation time. (服务已到期，请联系客服购买激活时长)"
                    }],
                    isError: true
                };
            }
        }
        try {
            const result = await handler(args);
            console.log(`[MCP] Result ${toolName}:`, JSON.stringify(result).substring(0, 200) + "...");
            return result;
        } catch (error: any) {
            console.error(`[MCP] Error ${toolName}:`, error);
            throw error;
        }
    }

    private async setupTools() {
        console.log(`[XiaozhiMCPServer] Setting up tools for service: '${this.serviceName}'`);

        // Base tools
        this.registerBaseTools();

        // Conditional Registration
        if (this.serviceName.includes("联网搜索")) {
            this.registerQwenSearchTool();
        } else if (this.serviceName.includes("做饭") || this.serviceName.includes("菜谱")) {
            this.registerCookTool();
        } else if (this.serviceName.includes("MBTI") || this.serviceName.includes("性格测试")) {
            this.registerMbtiTools();
        } else if (this.serviceName.includes("股票")) {
            this.registerStockTools();
        } else if (this.serviceName.includes("汇率")) {
            this.registerExchangeTools();
        } else if (this.serviceName.includes("12306") || this.serviceName.includes("火车票")) {
            this.registerTrainTools();
        } else if (this.serviceName.includes("黄金") || this.serviceName.includes("Gold")) {
            this.registerGoldTools();
        } else if (this.serviceName.includes("报告") || this.serviceName.includes("Report")) {
            this.registerReportTool();
        } else if (this.serviceName.includes("知识库") || this.serviceName.includes("Knowledge")) {
            this.registerPrivateDocsTool();
        } else if (this.serviceName.includes("快递") || this.serviceName.includes("Express")) {
            this.registerExpressTools();
        } else if (this.serviceName.includes("航班") || this.serviceName.includes("Flight") || this.serviceName.includes("Variflight")) {
            await this.registerVariflightTools();
        } else if (this.serviceName.includes("新闻") || this.serviceName.includes("News") || this.serviceName.includes("Verge")) {
            await this.registerVergeNewsTools();
        } else if (this.serviceName.includes("小说") || this.serviceName.includes("Novel") || this.serviceName.includes("Fanqie")) {
            await this.registerFanqieTools();
        } else {
            console.warn(`Unknown service name: ${this.serviceName}. Only base tools registered.`);
        }
    }

    private async registerFanqieTools() {
        console.log("[XiaozhiMCPServer] Registering Fanqie Novel tools...");
        const command = "node";
        const args = ["services/mcp-server-fanqie/build/index.js"];
        const env = { ...process.env } as Record<string, string>;

        await this.registerStdioTools(command, args, env);
    }

    private async registerVergeNewsTools() {
        console.log("[XiaozhiMCPServer] Registering Verge News tools...");
        const command = "node";
        // Path relative to backend root
        const args = ["services/verge-news-mcp/build/index.js"];
        const env = { ...process.env } as Record<string, string>;

        await this.registerStdioTools(command, args, env);
    }

    private async registerVariflightTools() {
        const apiKey = process.env.VARIFLIGHT_API_KEY;
        if (!apiKey) {
            console.error("VARIFLIGHT_API_KEY not found in environment variables.");
            return;
        }

        const command = "node";
        // Assuming running from backend root, node_modules is there.
        const args = ["node_modules/.bin/variflight-mcp"];
        const env = { ...process.env, VARIFLIGHT_API_KEY: apiKey } as Record<string, string>;

        await this.registerStdioTools(command, args, env);
    }

    private async registerStdioTools(command: string, args: string[], env: Record<string, string>) {
        console.log(`[StdioMCP] Registering stdio tools: ${command} ${args.join(" ")}`);

        try {
            const transport = new StdioClientTransport({
                command,
                args,
                env
            });

            const client = new Client({
                name: "XiaozhiMCPServer-Client",
                version: "1.0.0"
            }, {
                capabilities: {}
            });

            await client.connect(transport);
            this.stdioClients.push(client);

            const result = await client.listTools();
            console.log(`[StdioMCP] Found ${result.tools.length} tools`);

            for (const tool of result.tools) {
                console.log(`[StdioMCP] Registering tool: ${tool.name}`);

                // Store original schema for ListTools override
                this.proxyToolSchemas.set(tool.name, tool.inputSchema);

                this.server.registerTool(
                    tool.name,
                    {
                        inputSchema: z.object({}).passthrough()
                    },
                    async (args: any) => {
                        console.log(`[StdioMCP] Proxying request for ${tool.name}`);
                        console.log(`[StdioMCP] Args:`, JSON.stringify(args));

                        return this.wrapHandler(async (a) => {
                            const callResult = await client.callTool({
                                name: tool.name,
                                arguments: a
                            });
                            return callResult;
                        }, args, tool.name);
                    }
                );
            }

        } catch (error) {
            console.error(`[StdioMCP] Failed to register tools:`, error);
        }
    }

    private registerGoldTools() {
        this.server.tool(
            GetGoldPriceDefinition.name,
            GetGoldPriceDefinition.schema,
            async (args) => this.wrapHandler(handleGetGoldPrice, args, GetGoldPriceDefinition.name)
        );
    }

    private registerExpressTools() {
        this.server.tool(
            GetExpressInfoDefinition.name,
            GetExpressInfoDefinition.schema,
            async (args) => this.wrapHandler(handleGetExpressInfo, args, GetExpressInfoDefinition.name)
        );
    }

    private registerBaseTools() {
        this.server.tool(
            "echo",
            { message: z.string() },
            async (args) => this.wrapHandler(async ({ message }) => ({ content: [{ type: "text", text: `Echo: ${message}` }] }), args, "echo")
        );
        this.server.tool(
            "get_server_time",
            {},
            async (args) => this.wrapHandler(async () => ({ content: [{ type: "text", text: new Date().toISOString() }] }), args, "get_server_time")
        );
    }

    private registerQwenSearchTool() {
        this.server.tool(
            QwenSearchToolDefinition.name,
            QwenSearchToolDefinition.schema,
            async (args) => this.wrapHandler(handleQwenSearch, args, QwenSearchToolDefinition.name)
        );
    }

    private registerCookTool() {
        this.server.tool(
            HowToCookToolDefinition.name,
            HowToCookToolDefinition.schema,
            async (args) => this.wrapHandler(handleHowToCook, args, HowToCookToolDefinition.name)
        );
    }

    private registerMbtiTools() {
        this.server.tool(
            StartMbtiTestDefinition.name,
            StartMbtiTestDefinition.schema,
            async (args) => this.wrapHandler(handleStartMbtiTest, args, StartMbtiTestDefinition.name)
        );
        this.server.tool(
            AnswerQuestionDefinition.name,
            AnswerQuestionDefinition.schema,
            async (args) => this.wrapHandler(handleAnswerQuestion, args, AnswerQuestionDefinition.name)
        );
        this.server.tool(
            CalculateMbtiResultDefinition.name,
            CalculateMbtiResultDefinition.schema,
            async (args) => this.wrapHandler(handleCalculateResult, args, CalculateMbtiResultDefinition.name)
        );
    }

    private registerStockTools() {
        this.server.tool(
            GetStockQuoteDefinition.name,
            GetStockQuoteDefinition.schema,
            async (args) => this.wrapHandler(handleGetStockQuote, args, GetStockQuoteDefinition.name)
        );
        this.server.tool(
            GetStockHistoryDefinition.name,
            GetStockHistoryDefinition.schema,
            async (args) => this.wrapHandler(handleGetStockHistory, args, GetStockHistoryDefinition.name)
        );
    }

    private registerExchangeTools() {
        this.server.tool(
            GetExchangeRateDefinition.name,
            GetExchangeRateDefinition.schema,
            async (args) => this.wrapHandler(handleGetExchangeRate, args, GetExchangeRateDefinition.name)
        );
        this.server.tool(
            ConvertCurrencyDefinition.name,
            ConvertCurrencyDefinition.schema,
            async (args) => this.wrapHandler(handleConvertCurrency, args, ConvertCurrencyDefinition.name)
        );
    }

    private registerTrainTools() {
        this.server.tool(
            SearchTrainTicketsDefinition.name,
            SearchTrainTicketsDefinition.schema,
            async (args) => this.wrapHandler(handleSearchTrainTickets, args, SearchTrainTicketsDefinition.name)
        );
    }

    private registerReportTool() {
        this.server.tool(
            SearchReportsDefinition.name,
            SearchReportsDefinition.schema,
            async (args) => this.wrapHandler(handleSearchReports, args, SearchReportsDefinition.name)
        );
        this.server.tool(
            ReportExpertDefinition.name,
            ReportExpertDefinition.schema,
            async (args) => this.wrapHandler(handleReportExpert, args, ReportExpertDefinition.name)
        );
    }

    private registerPrivateDocsTool() {
        this.server.tool(
            PrivateDocsSearchDefinition.name,
            PrivateDocsSearchDefinition.schema,
            async (args) => {
                if (!this.userId) {
                    return {
                        content: [{ type: "text", text: "无法识别用户身份，请确保您已登录。" }],
                        isError: true
                    };
                }
                return this.wrapHandler(
                    (a) => handlePrivateDocsSearch(a, this.userId!),
                    args,
                    PrivateDocsSearchDefinition.name
                );
            }
        );
    }

    private proxyToolSchemas: Map<string, any> = new Map();

    async connect() {
        if (this.isConnected) return;

        try {
            await this.setupTools();
            console.log("Connecting to Xiaozhi via WebSocket...");
            await this.server.connect(this.transport);
            this.isConnected = true;
            console.log("MCP Server Connected and Ready.");

            // Override ListTools to support JSON Schema for proxy tools
            this.overrideListTools();
        } catch (error) {
            console.error("Failed to connect MCP Server:", error);
            throw error;
        }
    }

    private overrideListTools() {
        // Access internal server to overwrite handler
        // @ts-ignore
        const internalServer = this.server.server;

        internalServer.setRequestHandler(require("@modelcontextprotocol/sdk/types.js").ListToolsRequestSchema, async () => {
            // @ts-ignore
            const registeredTools = this.server._registeredTools;
            const toolsList = [];

            for (const [name, tool] of Object.entries(registeredTools)) {
                // @ts-ignore
                if (!tool.enabled) continue;

                let inputSchema;
                if (this.proxyToolSchemas.has(name)) {
                    // Use the original JSON schema for proxy tools
                    inputSchema = this.proxyToolSchemas.get(name);
                } else {
                    // Use SDK's conversion for Zod schemas
                    // We try to mimic SDK logic roughly or just produce "any" if fails.
                    // Since we can't easily access the internal zod-json-schema-compat, 
                    // we might have to accept that we only strictly fix the Proxy tools here.
                    // BUT valid Zod tools need their schema.
                    // Fortunately, McpServer tools usually hold the Zod schema in tool.inputSchema.
                    // We can try to use a basic replacement or if possible rely on internal props if available.

                    // Actually, we can try to require the compat module if the path is stable.
                    try {
                        const { normalizeObjectSchema } = require("@modelcontextprotocol/sdk/server/zod-compat.js");
                        const { toJsonSchemaCompat } = require("@modelcontextprotocol/sdk/server/zod-json-schema-compat.js");

                        // @ts-ignore
                        const obj = normalizeObjectSchema(tool.inputSchema);
                        inputSchema = obj ? toJsonSchemaCompat(obj, { strictUnions: true, pipeStrategy: 'input' }) : { type: "object", properties: {} };
                    } catch (e) {
                        console.warn("Could not load Zod compat utils, falling back to basic schema for", name);
                        inputSchema = { type: "object", properties: {} };
                    }
                }

                toolsList.push({
                    name,
                    // @ts-ignore
                    title: tool.title,
                    // @ts-ignore
                    description: tool.description,
                    inputSchema,
                    // @ts-ignore
                    annotations: tool.annotations
                });
            }

            return { tools: toolsList };
        });
    }

    async disconnect() {
        this.stdioClients.forEach(client => {
            try {
                // client.close(); 
            } catch (e) {
                console.error("Error closing stdio client:", e);
            }
        });

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
