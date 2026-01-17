import { AppDataSource, initializeDB } from '../db';
import { MCPService } from '../entities/MCPService';

const addService = async () => {
    await initializeDB();
    const repo = AppDataSource.getRepository(MCPService);

    const existing = await repo.findOne({ where: { name: "程序员做饭指南 (HowToCook)" } });
    if (existing) {
        console.log("Service 'HowToCook' already exists.");
        process.exit(0);
    }

    const service = repo.create({
        name: "程序员做饭指南 (HowToCook)",
        description: "GitHub 高赞开源菜谱，专为程序员设计的烹饪指南。提供详细的食材准备、步骤说明和成功秘诀。",
        imageUrl: "https://github.com/Anduin2017/HowToCook/raw/master/README.md" // Placeholder or actual icon if available
    });

    await repo.save(service);
    console.log("Service 'HowToCook' added successfully.");
    process.exit(0);
};

addService().catch(console.error);
