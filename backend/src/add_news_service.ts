
import { AppDataSource } from "./db";
import { MCPService } from "./entities/MCPService";

async function addNewsService() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected.");

        const serviceRepo = AppDataSource.getRepository(MCPService);

        // Check for old English name, previous mixed name, or new target name
        let existingService = await serviceRepo.findOne({ where: { name: "Verge News Service" } });
        if (!existingService) {
            existingService = await serviceRepo.findOne({ where: { name: "The Verge 新闻服务" } });
        }
        if (!existingService) {
            existingService = await serviceRepo.findOne({ where: { name: "新闻查询服务" } });
        }

        const config = JSON.stringify({
            type: "stdio",
            command: "node",
            args: ["services/verge-news-mcp/build/index.js"]
        });

        if (existingService) {
            console.log(`Service found (${existingService.name}). Updating...`);
            existingService.name = "新闻查询服务";
            existingService.description = "获取 The Verge 的最新科技新闻，支持查询今日新闻、最近一周新闻摘要以及按关键词搜索历史新闻。";
            existingService.status = "running";
            existingService.config = config;
            await serviceRepo.save(existingService);
            console.log("Updated News Service to 新闻查询服务.");
        } else {
            console.log("Creating News Service...");
            const newService = new MCPService();
            newService.name = "新闻查询服务";
            newService.description = "获取 The Verge 的最新科技新闻，支持查询今日新闻、最近一周新闻摘要以及按关键词搜索历史新闻。";
            newService.status = "running";
            newService.config = config;
            newService.url = "";
            await serviceRepo.save(newService);
            console.log("Added News Service.");
        }

        await AppDataSource.destroy();
        console.log("Database connection closed.");
    } catch (error) {
        console.error("Error adding service:", error);
        process.exit(1);
    }
}

addNewsService();
