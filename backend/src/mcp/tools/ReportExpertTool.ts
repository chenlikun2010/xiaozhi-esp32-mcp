import { z } from "zod";
import { ReportService } from "../../services/ReportService";

export const ReportExpertDefinition = {
    name: "report_expert",
    description: "An expert industry analyst that answers questions based on report database. It can also fetch new reports if not found locally. (行业报告专家，可检索和回答行业问题，并支持联网获取新报告)",
    schema: {
        query: z.string().describe("The user's question or topic to analyze. (用户的问题或主题)"),
        reportId: z.number().optional().describe("If the user specifies a specific report to read or summarize, provide its ID. (如果用户指定阅读某篇报告，提供其ID)")
    }
};

export async function handleReportExpert(args: any, extra?: any) {
    const { query, reportId } = args;
    const startTime = Date.now();
    console.log(`[Report Expert] Received request: query="${query}", reportId=${reportId}`);

    // Notify user that processing has started
    if (extra && extra.sendLoggingMessage) {
        extra.sendLoggingMessage({
            level: "info",
            data: "正在查询并总结报告内容，这可能需要几十秒钟，请您伸个懒腰放松一下...(Querying and summarizing, please relax...)"
        }).catch((err: any) => console.error("Failed to send logging message:", err));
    }

    try {
        let results;

        if (reportId) {
            // 1. Fetch specific report content
            console.log(`[Report Expert] Fetching specific report ID: ${reportId}`);
            results = await ReportService.getReportContentById(reportId);

            if (results.length === 0) {
                return {
                    content: [{
                        type: "text",
                        text: `Report with ID ${reportId} not found or has no content scanned.`
                    }]
                };
            }
        } else {
            // 2. Search Local Database
            results = await ReportService.search(query, 5); // Get top 5
        }

        // 3. If found relevant context, generate answer
        if (results.length > 0) {
            console.log(`[Report Expert] Found ${results.length} chunks for context.`);
            const answer = await ReportService.generateAnswer(query, results);
            console.log(`[Report Expert] Completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
            return {
                content: [{
                    type: "text",
                    text: answer
                }]
            };
        }

        // 4. Fallback: Search External API (only if not targeting specific report)
        if (!reportId) {
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
        }

        return {
            content: [{
                type: "text",
                text: "Sorry, I couldn't find any relevant industry reports locally or online regarding your query. (抱歉，无论是本地数据库还是联网检索，都未找到与您查询相关的行业报告。)"
            }]
        };

    } catch (error: any) {
        console.error(`[Report Expert] Error (took ${((Date.now() - startTime) / 1000).toFixed(2)}s):`, error);
        return {
            content: [{
                type: "text",
                text: `An error occurred while processing your request: ${error.message}`
            }],
            isError: true
        };
    }
}
