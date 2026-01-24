import axios from 'axios';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export const ZhipuSearchToolDefinition = {
    name: "internet_search",
    description: "Search the internet for up-to-date information using Zhipu AI (GLM). Preferred for general web searches.",
    schema: {
        query: z.string().describe("The search query to find information about."),
    }
};

export async function handleZhipuSearch(args: { query: string }) {
    console.log(`[Zhipu Search] Request: ${JSON.stringify(args)}`);
    const startTime = Date.now();

    const apiKey = process.env.ZHIPU_API_KEY;
    if (!apiKey) {
        console.error("[Zhipu Search] Error: ZHIPU_API_KEY missing");
        throw new Error("ZHIPU_API_KEY is not set in environment variables.");
    }

    const url = "https://open.bigmodel.cn/api/paas/v4/tools";
    const requestId = uuidv4();

    const payload = {
        tool: "web-search-pro",
        stream: false,
        messages: [
            {
                role: "user",
                content: args.query
            }
        ],
        request_id: requestId
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            timeout: 30000 // 30s timeout
        });

        const duration = Date.now() - startTime;
        console.log(`[Zhipu Search] Duration: ${duration}ms`);

        const data = response.data as any;
        if (!data.choices || data.choices.length === 0) {
            console.warn("[Zhipu Search] No choices returned.");
            return { content: [{ type: "text", text: "No results found." }] };
        }

        const message = data.choices[0].message;
        let resultText = "";

        // Check for tool_calls with search_result
        if (message.tool_calls) {
            for (const call of message.tool_calls) {
                if (call.type === 'search_result' && call.search_result) {
                    resultText += call.search_result.map((item: any, index: number) =>
                        `[${index + 1}] ${item.title}\nURL: ${item.link}\nSummary: ${item.content}\n`
                    ).join("\n");
                }
            }
        }

        // If not structured, check content
        if (!resultText && message.content) {
            resultText = message.content;
        }

        if (!resultText) {
            resultText = "No detailed search results returned.";
        }

        console.log(`[Zhipu Search] Result length: ${resultText.length}`);

        return {
            content: [{ type: "text", text: resultText }]
        };

    } catch (error: any) {
        console.error(`[Zhipu Search] Error:`, error.response?.data || error.message);
        return {
            content: [{ type: "text", text: `Error executing search: ${error.message}` }],
            isError: true
        };
    }
}
