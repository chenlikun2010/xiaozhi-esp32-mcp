import { AppDataSource, initializeDB } from '../db';
import { MCPService } from '../entities/MCPService';

const addService = async () => {
    await initializeDB();
    const repo = AppDataSource.getRepository(MCPService);

    const existing = await repo.findOne({ where: { name: "MBTI 性格测试" } });
    if (existing) {
        console.log("Service 'MBTI 性格测试' already exists.");
        process.exit(0);
    }

    const service = repo.create({
        name: "MBTI 性格测试",
        description: "基于开源项目的 MBTI 性格测试服务。通过对话完成测试，了解你的性格类型（E/I, S/N, T/F, J/P）。",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1f/MyersBriggsTypes.png" // Placeholder or actual icon if available
    });

    await repo.save(service);
    console.log("Service 'MBTI 性格测试' added successfully.");
    process.exit(0);
};

addService().catch(console.error);
