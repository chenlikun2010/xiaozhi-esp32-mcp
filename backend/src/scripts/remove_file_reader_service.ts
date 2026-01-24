import { AppDataSource, initializeDB } from "../db";
import { MCPService } from "../entities/MCPService";
import { UserMCPInstance } from "../entities/UserMCPInstance";

const removeService = async () => {
    await initializeDB();

    const repo = AppDataSource.getRepository(MCPService);
    const instanceRepo = AppDataSource.getRepository(UserMCPInstance);

    // Find service with name "文件读取" or "File Reader"
    const services = await repo.find({
        where: [
            { name: "文件读取" },
            { name: "File Reader" }
        ]
    });

    if (services.length > 0) {
        console.log(`Found ${services.length} services to remove:`);
        for (const s of services) {
            console.log(`Processing Service ID: ${s.id}, Name: ${s.name}`);

            // Delete related instances first
            const instances = await instanceRepo.find({ where: { serviceId: s.id } });
            if (instances.length > 0) {
                console.log(`- Deleting ${instances.length} user instances linked to this service...`);
                await instanceRepo.remove(instances);
            }

            console.log(`- Removing Service ID: ${s.id}`);
            await repo.remove(s);
        }
        console.log("Removal successful.");
    } else {
        console.log("No service named '文件读取' or 'File Reader' found.");
    }

    process.exit(0);
};

removeService();
