
import { AppDataSource, initializeDB } from '../db';
import { MCPService } from '../entities/MCPService';

const removeService = async () => {
    await initializeDB();
    const repo = AppDataSource.getRepository(MCPService);

    const serviceName = "数据库连接器";
    const service = await repo.findOne({ where: { name: serviceName } });

    if (!service) {
        console.log(`Service '${serviceName}' not found.`);
        process.exit(0);
    }

    try {
        await repo.remove(service);
        console.log(`Service '${serviceName}' (ID: ${service.id}) removed successfully.`);
    } catch (error) {
        console.error(`Error removing service:`, error);
    }

    process.exit(0);
};

removeService().catch(console.error);
