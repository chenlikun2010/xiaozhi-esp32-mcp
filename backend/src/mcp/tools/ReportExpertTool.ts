import { z } from "zod";
import { ReportService } from "../../services/ReportService";

export const ReportExpertDefinition = {
    name: "report_expert",
    description: "An expert industry analyst that answers questions based on report database. It can also fetch new reports if not found locally. (行业报告专家，可检索和回答行业问题，并支持联网获取新报告)",
    schema: {
        query: z.string().describe("The user's question or topic to analyze. (用户的问题或主题)"),
    }
};

export async function handleReportExpert(args: any) {
    const { query } = args;
    try {
        // 1. Search Local Database
        const results = await ReportService.search(query, 5); // Get top 5

        // 2. If found relevant context, generate answer
        if (results.length > 0) {
            console.log(`[Report Expert] Found ${results.length} local results for "${query}"`);
            const answer = await ReportService.generateAnswer(query, results);
            return {
                content: [{
                    type: "text",
                    text: answer
                }]
            };
        }

        // 3. Fallback: Search External API
        console.log(`[Report Expert] No local results. Searching external API...`);
        const addedCount = await ReportService.searchExternal(query);

        if (addedCount > 0) {
            return {
                content: [{
                    type: "text",
                    text: `Local database has no relevant reports, but I found ${addedCount} related reports online and added them to the processing queue. Please ask again in a few minutes once they are analyzed. (本地库暂无相关报告，但我已联网找到 ${addedCount} 份相关报告并加入解析队列，请稍后再次提问。)`
                }]
            };
        }

        return {
            content: [{
                type: "text",
                text: "Sorry, I couldn't find any relevant industry reports locally or online regarding your query. (抱歉，无论是本地数据库还是联网检索，都未找到与您查询相关的行业报告。)"
            }]
        };

    } catch (error: any) {
        console.error(`[Report Expert] Error:`, error);
        return {
            content: [{
                type: "text",
                text: `An error occurred while processing your request: ${error.message}`
            }],
            isError: true
        };
    }
}
