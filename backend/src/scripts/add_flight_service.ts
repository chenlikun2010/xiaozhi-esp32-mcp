import { AppDataSource } from '../db';
import { MCPService } from '../entities/MCPService';
import * as dotenv from 'dotenv';
dotenv.config();

async function seed() {
    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");

        const repo = AppDataSource.getRepository(MCPService);

        const serviceName = "携程机票查询"; // Keywords: "机票", "携程" trigger the tool

        let service = await repo.findOne({ where: { name: serviceName } });

        if (!service) {
            service = new MCPService();
            service.name = serviceName;
            service.description = "支持查询国内航线机票，实时获取航班号、起降时间及价格信息。（基于携程数据）";
            service.imageUrl = "https://images.unsplash.com/photo-1436491865332-7a6153217f27?q=80&w=200&auto=format&fit=crop";
            await repo.save(service);
            console.log(`Service '${serviceName}' created.`);
        } else {
            console.log(`Service '${serviceName}' already exists.`);
        }

        process.exit(0);
    } catch (error) {
        console.error("Error seeding data:", error);
        process.exit(1);
    }
}

seed();
