import { AppDataSource, initializeDB } from "../db";
import { MCPService } from "../entities/MCPService";

const updateService = async () => {
    await initializeDB();

    const repo = AppDataSource.getRepository(MCPService);

    const service = await repo.findOne({
        where: [
            { name: "Internet Search" },
            { name: "联网搜索" }
        ]
    });

    if (service) {
        console.log(`Updating service ${service.name} (ID: ${service.id})...`);
        service.description = "Search the web using Zhipu AI (GLM) for up-to-date information.";
        await repo.save(service);
        console.log("Update successful.");
    } else {
        console.log("No Internet Search service found.");
    }

    process.exit(0);
};

updateService();
