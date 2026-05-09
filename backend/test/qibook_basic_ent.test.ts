import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { HttpsProxyAgent } from "https-proxy-agent";

const connectAndList = async (headerKey: string) => {
  const base = process.env.QIBOOK_SERVER_URL || "https://mcp.bidata.com/mcp/basic";
  const accessKey = process.env.QIBOOK_ACCESS_KEY || "";
  const proxyUrl = process.env.QIBOOK_PROXY || process.env.HTTPS_PROXY;
  if (!accessKey) {
    throw new Error('QIBOOK_ACCESS_KEY is missing');
  }
  let agent: any;
  if (proxyUrl) agent = new HttpsProxyAgent(proxyUrl);
  const candidates = [base, `${base}/sse`, `${base}/stream`, `${base}/events`];
  let lastErr: any;
  for (const url of candidates) {
    try {
      const transport = new SSEClientTransport(new URL(url), {
        eventSourceInit: {
          headers: { [headerKey]: accessKey, "Accept": "text/event-stream" },
          https: agent ? { agent } : undefined
        } as any
      });
      const client = new Client({ name: "QibookTest", version: "1.0.0" }, { capabilities: {} });
      await client.connect(transport);
      const tools = await client.listTools();
      return { client, tools };
    } catch (e) {
      lastErr = e;
    }
  }
  // Fallback to Streamable HTTP with headers
  try {
    const httpTransport = new StreamableHTTPClientTransport(new URL(base), {
      requestInit: {
        headers: { [headerKey]: accessKey }
      } as any
    });
    const client = new Client({ name: "QibookTest", version: "1.0.0" }, { capabilities: {} });
    await client.connect(httpTransport);
    const tools = await client.listTools();
    return { client, tools };
  } catch (e) {
    lastErr = e;
  }
  throw lastErr;
};

const pickEntSearchTool = (tools: any[]) => {
  const byName = tools.find((t) => /ent|company|工商|search/i.test(t.name));
  if (byName) return byName;
  for (const t of tools) {
    const props = (t.inputSchema?.properties) || {};
    const keys = Object.keys(props);
    if (keys.some(k => /keyword|name|company/i.test(k))) return t;
  }
  return undefined;
};

describe('企业公司信息查询', () => {
  it('查询 北京慧极科技有限公司', async () => {
    if (!process.env.QIBOOK_ACCESS_KEY) {
      console.warn('Skipping qibook_basic_ent.test.ts because QIBOOK_ACCESS_KEY is not set.');
      return;
    }

    let client: Client | undefined;
    try {
      let conn;
      try {
        conn = await connectAndList("access_key");
      } catch {
        conn = await connectAndList("asses_key");
      }
      client = conn.client;
      const tool = pickEntSearchTool(conn.tools.tools);
      expect(tool).toBeDefined();
      const props = (tool!.inputSchema?.properties) || {};
      const args: any = {};
      if (props.keyword) args.keyword = "北京慧极科技有限公司";
      else if (props.name) args.name = "北京慧极科技有限公司";
      else if (props.company_name) args.company_name = "北京慧极科技有限公司";
      else if (props.query) args.query = "北京慧极科技有限公司";
      else args.keyword = "北京慧极科技有限公司";
      const result = await client.callTool({ name: tool!.name, arguments: args });
      expect(result).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
    } finally {
      if (client) await client.close();
    }
  }, 30000);
});
