
import { AppDataSource } from "./db";
import { MCPService } from "./entities/MCPService";
import { UserMCPInstance } from "./entities/UserMCPInstance";

async function removeCompanyService() {
    try {
        await AppDataSource.initialize();
        const repo = AppDataSource.getRepository(MCPService);
        const userInstanceRepo = AppDataSource.getRepository(UserMCPInstance);

        const serviceToRemove = await repo.findOne({ where: { id: 15 } }); // ID found in previous step "企业公司信息查询"

        if (serviceToRemove) {
            // Cascade delete instances first
            const instances = await userInstanceRepo.find({ where: { service: { id: serviceToRemove.id } } });
            if (instances.length > 0) {
                await userInstanceRepo.remove(instances);
                console.log(`Removed ${instances.length} user instances.`);
            }

            await repo.remove(serviceToRemove);
            console.log(`Removed service: ${serviceToRemove.name}`);
        } else {
            console.log("Service ID 15 not found.");
        }

        await AppDataSource.destroy();
    } catch (e) {
        console.error(e);
    }
}

removeCompanyService();
