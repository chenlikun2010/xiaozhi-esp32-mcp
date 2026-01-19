import { z } from "zod";
import { ReportService } from "../../services/ReportService";

export const SearchReportsDefinition = {
    name: "search_reports",
    description: "Search for industry reports and analysis. Use this tool when the user asks for reports, white papers, market analysis, or specific industry trends. (搜索行业报告、白皮书、市场分析)",
    schema: {
        query: z.string().describe("The search query for reports. Should be specific and descriptive. (搜索关键词)"),
        limit: z.number().optional().default(5).describe("Maximum number of results to return. Default is 5.")
    }
};

export async function handleSearchReports(args: any) {
    const { query, limit } = args;
    try {
        const results = await ReportService.search(query, limit);

        if (results.length === 0) {
            return {
                content: [{
                    type: "text",
                    text: "No relevant reports found. (未找到相关报告)"
                }]
            };
        }

        const reportTexts = results.map(r =>
            `Title: ${r.title}\nPublish Time: ${r.publish_time ? new Date(r.publish_time).toLocaleDateString() : 'Unknown'}\nSimilarity: ${(r.similarity * 100).toFixed(1)}%\nURL: ${r.word_url}\nContent Snippet: ${r.content}\n`
        ).join("\n---\n");

        return {
            content: [{
                type: "text",
                text: `Found ${results.length} relevant reports:\n\n${reportTexts}`
            }]
        };
    } catch (error: any) {
        return {
            content: [{
                type: "text",
                text: `Error searching reports: ${error.message}`
            }],
            isError: true
        };
    }
}
