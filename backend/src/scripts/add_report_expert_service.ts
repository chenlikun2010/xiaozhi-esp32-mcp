import { AppDataSource, initializeDB } from '../db';
import { MCPService } from '../entities/MCPService';

const addService = async () => {
    await initializeDB();
    const repo = AppDataSource.getRepository(MCPService);

    const name = "行业报告专家";
    const existing = await repo.findOne({ where: { name } });
    if (existing) {
        console.log(`Service '${name}' already exists.`);
        process.exit(0);
    }

    const service = repo.create({
        name: name,
        description: "专业的行业报告分析助手。内置 2026 年最新行业趋势报告库，支持语义检索、深度问答与总结。如果本地库缺失，会自动联网检索最新报告并加入分析。",
        imageUrl: "/report_expert.png"
    });

    await repo.save(service);
    console.log(`Service '${name}' added successfully.`);
    process.exit(0);
};

addService().catch(console.error);
