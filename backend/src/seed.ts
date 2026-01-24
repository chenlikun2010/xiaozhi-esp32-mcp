import { AppDataSource, initializeDB } from "./db";
import { MCPService } from "./entities/MCPService";

const seed = async () => {
    await initializeDB();

    const repo = AppDataSource.getRepository(MCPService);
    const count = await repo.count();

    if (count === 0) {
        console.log("Seeding MCP Services...");
        const services = [
            { name: "Internet Search", description: "Search the web using Qwen Search (Alibaba).", imageUrl: "https://img.alice.com/search_icon.png" }, // Placeholder image or empty

            { name: "Database Connector", description: "Connect to SQL databases." }
        ];

        for (const s of services) {
            const service = repo.create(s);
            await repo.save(service);
        }
        console.log("Seeding complete.");
    } else {
        console.log("MCP Services already seeded.");
    }

    process.exit(0);
};

seed();
