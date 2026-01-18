import { AppDataSource, initializeDB } from '../db';
import { MCPService } from '../entities/MCPService';

const addService = async () => {
    await initializeDB();
    const repo = AppDataSource.getRepository(MCPService);

    let service = await repo.findOne({ where: { name: "MBTI 性格测试" } });

    if (service) {
        console.log("Service 'MBTI 性格测试' already exists. Updating description...");
    } else {
        console.log("Creating new service 'MBTI 性格测试'...");
        service = repo.create({
            name: "MBTI 性格测试",
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1f/MyersBriggsTypes.png"
        });
    }

    service.description = "基于开源项目的 MBTI 性格测试服务。通过对话完成测试，了解你的性格类型（E/I, S/N, T/F, J/P）。";

    await repo.save(service);
    console.log("Service 'MBTI 性格测试' saved successfully.");
    process.exit(0);
};

addService().catch(console.error);
