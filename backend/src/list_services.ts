
import { AppDataSource } from "./db";
import { MCPService } from "./entities/MCPService";

async function listServices() {
    try {
        await AppDataSource.initialize();
        const repo = AppDataSource.getRepository(MCPService);
        const services = await repo.find();
        console.log("Current Services:");
        services.forEach(s => {
            console.log(`ID: ${s.id}, Name: ${s.name}, Status: ${s.status}`);
        });
        await AppDataSource.destroy();
    } catch (e) {
        console.error(e);
    }
}

listServices();
