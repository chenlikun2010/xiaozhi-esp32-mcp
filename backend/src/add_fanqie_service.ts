
import { AppDataSource } from "./db";
import { MCPService } from "./entities/MCPService";

async function addFanqieService() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected.");

        const serviceRepo = AppDataSource.getRepository(MCPService);

        const existingService = await serviceRepo.findOne({ where: { name: "番茄小说全能助手" } });

        const config = JSON.stringify({
            type: "stdio",
            command: "node",
            args: ["services/mcp-server-fanqie/build/index.js"]
        });

        if (existingService) {
            console.log(`Service found (${existingService.name}). Updating...`);
            existingService.name = "番茄小说全能助手";
            existingService.description = "提供番茄小说的搜索、书籍详情、目录及阅读功能。支持按关键词搜索小说，获取榜单，查看章节内容及书评。(Fanqie Novel Reader)";
            existingService.status = "running";
            existingService.config = config;
            await serviceRepo.save(existingService);
            console.log("Updated Fanqie Service.");
        } else {
            console.log("Creating Fanqie Service...");
            const newService = new MCPService();
            newService.name = "番茄小说全能助手";
            newService.description = "提供番茄小说的搜索、书籍详情、目录及阅读功能。支持按关键词搜索小说，获取榜单，查看章节内容及书评。(Fanqie Novel Reader)";
            newService.status = "running";
            newService.config = config;
            newService.url = "";
            await serviceRepo.save(newService);
            console.log("Added Fanqie Service.");
        }

        await AppDataSource.destroy();
        console.log("Database connection closed.");
    } catch (error) {
        console.error("Error adding service:", error);
        process.exit(1);
    }
}

addFanqieService();
