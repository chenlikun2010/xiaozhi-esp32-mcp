import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebSocketClientTransport } from "./WebSocketClientTransport";
import { z } from "zod";
import { QwenSearchToolDefinition, handleQwenSearch } from "./tools/QwenSearchTool";
import { HowToCookToolDefinition, handleHowToCook } from "./tools/HowToCookTool";
import { StartMbtiTestDefinition, AnswerQuestionDefinition, CalculateMbtiResultDefinition, handleStartMbtiTest, handleAnswerQuestion, handleCalculateResult } from "./tools/MbtiTool";
import { GetStockQuoteDefinition, GetStockHistoryDefinition, handleGetStockQuote, handleGetStockHistory } from "./tools/StockTool";
import { GetExchangeRateDefinition, ConvertCurrencyDefinition, handleGetExchangeRate, handleConvertCurrency } from "./tools/ExchangeRateTool";
import { SearchTrainTicketsDefinition, handleSearchTrainTickets } from "./tools/TrainTicketTool";

export class XiaozhiMCPServer {
    private server: McpServer;
    private transport: WebSocketClientTransport;
    private isConnected: boolean = false;
    private serviceName: string;
    private checkExpiry?: () => Promise<boolean>;

    constructor(wssUrl: string, serviceName: string = "Xiaozhi MCP Service", checkExpiry?: () => Promise<boolean>) {
        this.server = new McpServer({
            name: serviceName,
            version: "1.0.0"
        });
        this.serviceName = serviceName;
        this.checkExpiry = checkExpiry;

        this.transport = new WebSocketClientTransport(wssUrl);

        // Register tools based on service name
        this.setupTools();
    }

    private async wrapHandler(handler: (args: any) => Promise<any>, args: any) {
        if (this.checkExpiry) {
            const isExpired = await this.checkExpiry();
            if (isExpired) {
                return {
                    content: [{
                        type: "text",
                        text: "Service Expired. Please contact customer service to purchase activation time. (服务已到期，请联系客服购买激活时长)"
                    }],
                    isError: true
                };
            }
        }
        return await handler(args);
    }

    private setupTools() {
        console.log(`[XiaozhiMCPServer] Setting up tools for service: '${this.serviceName}'`);

        // Base tools
        this.registerBaseTools();

        // Conditional Registration
        if (this.serviceName.includes("联网搜索")) {
            this.registerQwenSearchTool();
        } else if (this.serviceName.includes("做饭")) {
            this.registerCookTool();
        } else if (this.serviceName.includes("MBTI") || this.serviceName.includes("性格测试")) {
            this.registerMbtiTools();
        } else if (this.serviceName.includes("股票")) {
            this.registerStockTools();
        } else if (this.serviceName.includes("汇率")) {
            this.registerExchangeTools();
        } else if (this.serviceName.includes("12306") || this.serviceName.includes("火车票")) {
            this.registerTrainTools();
        } else {
            console.warn(`Unknown service name: ${this.serviceName}. Only base tools registered.`);
        }
    }

    private registerBaseTools() {
        this.server.tool(
            "echo",
            { message: z.string() },
            async (args) => this.wrapHandler(async ({ message }) => ({ content: [{ type: "text", text: `Echo: ${message}` }] }), args)
        );
        this.server.tool(
            "get_server_time",
            {},
            async (args) => this.wrapHandler(async () => ({ content: [{ type: "text", text: new Date().toISOString() }] }), args)
        );
    }

    private registerQwenSearchTool() {
        this.server.tool(
            QwenSearchToolDefinition.name,
            QwenSearchToolDefinition.schema,
            async (args) => this.wrapHandler(handleQwenSearch, args)
        );
    }

    private registerCookTool() {
        this.server.tool(
            HowToCookToolDefinition.name,
            HowToCookToolDefinition.schema,
            async (args) => this.wrapHandler(handleHowToCook, args)
        );
    }

    private registerMbtiTools() {
        this.server.tool(
            StartMbtiTestDefinition.name,
            StartMbtiTestDefinition.schema,
            async (args) => this.wrapHandler(handleStartMbtiTest, args)
        );
        this.server.tool(
            AnswerQuestionDefinition.name,
            AnswerQuestionDefinition.schema,
            async (args) => this.wrapHandler(handleAnswerQuestion, args)
        );
        this.server.tool(
            CalculateMbtiResultDefinition.name,
            CalculateMbtiResultDefinition.schema,
            async (args) => this.wrapHandler(handleCalculateResult, args)
        );
    }

    private registerStockTools() {
        this.server.tool(
            GetStockQuoteDefinition.name,
            GetStockQuoteDefinition.schema,
            async (args) => this.wrapHandler(handleGetStockQuote, args)
        );
        this.server.tool(
            GetStockHistoryDefinition.name,
            GetStockHistoryDefinition.schema,
            async (args) => this.wrapHandler(handleGetStockHistory, args)
        );
    }

    private registerExchangeTools() {
        this.server.tool(
            GetExchangeRateDefinition.name,
            GetExchangeRateDefinition.schema,
            async (args) => this.wrapHandler(handleGetExchangeRate, args)
        );
        this.server.tool(
            ConvertCurrencyDefinition.name,
            ConvertCurrencyDefinition.schema,
            async (args) => this.wrapHandler(handleConvertCurrency, args)
        );
    }

    private registerTrainTools() {
        this.server.tool(
            SearchTrainTicketsDefinition.name,
            SearchTrainTicketsDefinition.schema,
            async (args) => this.wrapHandler(handleSearchTrainTickets, args)
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
