import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type ServiceProbe = {
    name: string;
    executable: string;
};

const services: ServiceProbe[] = [
    { name: "八字计算器", executable: "bazi-mcp" },
    { name: "中国姓名生成分析工具", executable: "chinese-naming-mcp" },
];

async function listTools(service: ServiceProbe) {
    const transport = new StdioClientTransport({
        command: "node",
        args: [`node_modules/.bin/${service.executable}`],
        env: { ...process.env } as Record<string, string>,
    });
    const client = new Client(
        { name: "culture-service-smoke-test", version: "1.0.0" },
        { capabilities: {} },
    );

    try {
        await client.connect(transport);
        const result = await client.listTools();
        if (result.tools.length === 0) {
            throw new Error(`${service.name} did not expose any MCP tools`);
        }
        console.log(`${service.name}: ${result.tools.map((tool) => tool.name).join(", ")}`);
    } finally {
        await client.close();
    }
}

async function main() {
    for (const service of services) {
        await listTools(service);
    }
}

main().catch((error) => {
    console.error("Culture MCP service smoke test failed:", error);
    process.exit(1);
});
