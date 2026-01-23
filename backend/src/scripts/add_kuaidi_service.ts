
import { AppDataSource, initializeDB } from '../db';
import { MCPService } from '../entities/MCPService';

const addService = async () => {
    await initializeDB();
    const repo = AppDataSource.getRepository(MCPService);

    const name = "快递查询助手";
    const existing = await repo.findOne({ where: { name } });
    if (existing) {
        console.log(`Service '${name}' already exists.`);
        process.exit(0);
    }

    const service = repo.create({
        name: name,
        description: "支持顺丰、圆通、中通、申通、韵达等全网快递物流轨迹实时查询。",
        imageUrl: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png" // Generic package icon
    });

    await repo.save(service);
    console.log(`Service '${name}' added successfully.`);
    process.exit(0);
};

addService().catch(console.error);
