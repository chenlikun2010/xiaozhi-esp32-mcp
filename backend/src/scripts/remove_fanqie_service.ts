
import { AppDataSource, initializeDB } from '../db';
import { MCPService } from '../entities/MCPService';
import { UserMCPInstance } from '../entities/UserMCPInstance';

const removeFanqie = async () => {
    await initializeDB();
    const repo = AppDataSource.getRepository(MCPService);
    const instanceRepo = AppDataSource.getRepository(UserMCPInstance);

    const serviceName = "Fanqie Novel"; // Or search by likely names

    // Find service
    // Use Like just in case slightly different name
    const services = await repo.createQueryBuilder("service")
        .where("service.name LIKE :name", { name: `%Fanqie%` })
        .orWhere("service.name LIKE :name2", { name2: `%番茄%` })
        .getMany();

    if (services.length === 0) {
        console.log("No Fanqie service found to remove.");
        process.exit(0);
    }

    for (const service of services) {
        console.log(`Found service: ${service.name} (ID: ${service.id})`);

        // Find instances using this service
        const instances = await instanceRepo.find({ where: { serviceId: service.id } });
        if (instances.length > 0) {
            console.log(`Found ${instances.length} active instances for this service. Removing them first...`);
            await instanceRepo.remove(instances);
            console.log("Instances removed.");
        }

        console.log(`Removing service ${service.name}...`);
        await repo.remove(service);
        console.log("Service removed.");
    }

    console.log("Done.");
    process.exit(0);
};

removeFanqie().catch(error => {
    console.error("Error:", error);
    process.exit(1);
});
