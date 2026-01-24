import axios from 'axios';
import { z } from 'zod';

export const QwenSearchToolDefinition = {
    name: "qwen_internet_search",
    description: "Search the internet for up-to-date information using Alibaba Qwen AI.",
    schema: {
        query: z.string().describe("The search query to find information about."),
    }
};

export async function handleQwenSearch(args: { query: string }) {
    console.log(`[Qwen Search] Request: ${JSON.stringify(args)}`);
    const startTime = Date.now();

    const apiKey = process.env.QWEN_API_KEY;
    if (!apiKey) {
        console.error("[Qwen Search] Error: QWEN_API_KEY missing");
        throw new Error("QWEN_API_KEY is not set in environment variables.");
    }

    const url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

    const payload = {
        model: "qwen-turbo",
        input: {
            messages: [
                {
                    role: "user",
                    content: args.query
                }
            ]
        },
        parameters: {
            enable_search: true,
            result_format: "message"
        }
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        });

        const duration = Date.now() - startTime;
        const data = response.data as any;
        if (data.output && data.output.choices && data.output.choices.length > 0) {
            const content = data.output.choices[0].message.content;
            console.log(`[Chat Log] Query: "${args.query}"`);
            console.log(`[Chat Log] Result: ${content.substring(0, 200)}...`); // Summary log
            return {
                content: [{ type: "text" as const, text: content }]
            };
        } else {
            console.log(`[Chat Log] Query: "${args.query}" - No results found.`);
            return {
                content: [{ type: "text" as const, text: "No results found or invalid response from Qwen API." }]
            };
        }

    } catch (error: any) {
        console.error(`[Qwen Search] Error:`, error.response?.data || error.message);
        return {
            content: [{ type: "text" as const, text: `Error executing search: ${error.message}` }],
            isError: true
        };
    }
}
