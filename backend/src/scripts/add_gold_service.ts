
import { AppDataSource, initializeDB } from '../db';
import { MCPService } from '../entities/MCPService';

const addService = async () => {
    await initializeDB();
    const repo = AppDataSource.getRepository(MCPService);

    const name = "黄金价格查询";
    const existing = await repo.findOne({ where: { name } });
    if (existing) {
        console.log(`Service '${name}' already exists.`);
        process.exit(0);
    }

    const service = repo.create({
        name: name,
        description: "基于实时市场数据的黄金价格查询助手。支持查询国际金价 (XAU/USD)。",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/64/Gold_Bullion_Coins.jpg"
    });

    await repo.save(service);
    console.log(`Service '${name}' added successfully.`);
    process.exit(0);
};

addService().catch(console.error);
