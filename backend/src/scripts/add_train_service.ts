import { AppDataSource, initializeDB } from '../db';
import { MCPService } from '../entities/MCPService';

const addService = async () => {
    await initializeDB();
    const repo = AppDataSource.getRepository(MCPService);

    const existing = await repo.findOne({ where: { name: "12306 火车票助手" } });
    if (existing) {
        console.log("Service '12306 火车票助手' already exists.");
        process.exit(0);
    }

    const service = repo.create({
        name: "12306 火车票助手",
        description: "基于官方数据的实时火车票余票查询服务。支持查询全国主要城市的车次、时刻与票务状态。",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e0/China_Railways.svg"
    });

    await repo.save(service);
    console.log("Service '12306 火车票助手' added successfully.");
    process.exit(0);
};

addService().catch(console.error);
