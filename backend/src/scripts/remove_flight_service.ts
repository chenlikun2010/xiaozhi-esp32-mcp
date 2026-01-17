import { AppDataSource } from '../db';
import { MCPService } from '../entities/MCPService';
import * as dotenv from 'dotenv';
dotenv.config();

async function removeService() {
    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");

        const repo = AppDataSource.getRepository(MCPService);
        const serviceName = "携程机票查询";

        const service = await repo.findOne({ where: { name: serviceName } });

        if (service) {
            // Must delete instances first due to Foreign Key constraint
            await AppDataSource.query(`DELETE FROM user_mcp_instance WHERE service_id = ?`, [service.id]);
            await repo.remove(service);
            console.log(`Service '${serviceName}' (and its instances) removed from marketplace.`);
        } else {
            console.log(`Service '${serviceName}' not found.`);
        }

        process.exit(0);
    } catch (error) {
        console.error("Error removing service:", error);
        process.exit(1);
    }
}

removeService();
