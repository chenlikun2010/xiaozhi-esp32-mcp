import axios from 'axios';
import { z } from 'zod';

export const HowToCookToolDefinition = {
    name: "how_to_cook",
    description: "Find recipes and cooking guides for programmers from the HowToCook open source project.",
    schema: {
        dish_name: z.string().describe("The name of the dish you want to learn how to cook, e.g. 'Red Braised Pork' or 'Scrambled Eggs with Tomato'."),
    }
};

export async function handleHowToCook(args: { dish_name: string }) {
    console.log(`[Chat Log] Tool: how_to_cook, Dish: "${args.dish_name}"`);
    const startTime = Date.now();

    const apiKey = process.env.QWEN_API_KEY;
    if (!apiKey) {
        throw new Error("QWEN_API_KEY is not set.");
    }

    // Specialized prompt to search within the specific repo context
    const prompt = `
You are a master chef helping a programmer cook. 
Your knowledge base is strictly the content from the GitHub repository "Anduin2017/HowToCook".
The user wants to know how to cook: "${args.dish_name}".

Please search for this dish in the HowToCook repository content/context.
Return a structured recipe including:
1. Preparation (ingredients, tools)
2. Steps (clear, numbered instructions)
3. Tips (crucial advice for success)

If you cannot find the specific dish in the HowToCook context, provide a general best-practice recipe but mention it might not be from the repo.
    `.trim();

    const url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

    const payload = {
        model: "qwen-turbo",
        input: {
            messages: [
                {
                    role: "system",
                    content: "You are a helpful cooking assistant specialized in the HowToCook GitHub project."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        },
        parameters: {
            enable_search: true, // Enable search to find the repo content
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
            console.log(`[Chat Log] Result: Found recipe for ${args.dish_name} (${content.length} chars)`);
            return {
                content: [{ type: "text" as const, text: content }]
            };
        } else {
            console.log(`[Chat Log] Result: No recipe found for ${args.dish_name}`);
            return {
                content: [{ type: "text" as const, text: "Sorry, I couldn't find a recipe for that dish in the HowToCook library." }]
            };
        }

    } catch (error: any) {
        console.error(`[HowToCook] Error:`, error.response?.data || error.message);
        return {
            content: [{ type: "text" as const, text: `Error finding recipe: ${error.message}` }],
            isError: true
        };
    }
}
