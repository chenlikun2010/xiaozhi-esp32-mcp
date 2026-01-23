
import { AppDataSource } from "./db";
import { MCPService } from "./entities/MCPService";

async function addFlightService() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected.");

        const serviceRepo = AppDataSource.getRepository(MCPService);

        // Find by old name OR new name to avoid duplicates during multiple runs
        let existingService = await serviceRepo.findOne({ where: { name: "Variflight Service" } });
        if (!existingService) {
            existingService = await serviceRepo.findOne({ where: { name: "飞常准航班服务" } });
        }

        if (existingService) {
            console.log(`Service found (${existingService.name}). Updating to Chinese...`);
            existingService.name = "飞常准航班服务";
            existingService.description = "提供全面的航班信息查询服务，支持按航班号、起降地查询航班状态、时刻表及行程信息，同时提供机场天气查询功能。";
            existingService.status = "running";
            existingService.config = JSON.stringify({
                type: "stdio",
                command: "npx",
                args: ["-y", "@variflight-ai/variflight-mcp"]
            });
            await serviceRepo.save(existingService);
            console.log("Updated Variflight Service to 飞常准航班服务.");
        } else {
            console.log("Creating 飞常准航班服务...");
            const newService = new MCPService();
            newService.name = "飞常准航班服务";
            newService.description = "提供全面的航班信息查询服务，支持按航班号、起降地查询航班状态、时刻表及行程信息，同时提供机场天气查询功能。";
            newService.status = "running";
            newService.config = JSON.stringify({
                type: "stdio",
                command: "npx",
                args: ["-y", "@variflight-ai/variflight-mcp"]
            });
            newService.url = ""; // No remote URL for stdio
            await serviceRepo.save(newService);
            console.log("Added 飞常准航班服务.");
        }

        await AppDataSource.destroy();
        console.log("Database connection closed.");
    } catch (error) {
        console.error("Error adding service:", error);
        process.exit(1);
    }
}

addFlightService();
