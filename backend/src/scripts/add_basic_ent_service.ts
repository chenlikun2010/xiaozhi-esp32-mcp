import { AppDataSource, initializeDB } from '../db';
import { MCPService } from '../entities/MCPService';

const addService = async () => {
    await initializeDB();
    const repo = AppDataSource.getRepository(MCPService);

    const existing = await repo.findOne({ where: { name: "企业公司信息查询" } });
    if (existing) {
        console.log("Service '企业公司信息查询' already exists.");
        process.exit(0);
    }

    const service = repo.create({
        name: "企业公司信息查询",
        description: "基于 Qibook 提供的企业基础信息查询工具集，支持工商注册信息、法人、股东、经营范围等基础企业数据的检索。",
        imageUrl: "https://img.icons8.com/ios-filled/100/company.png"
    });

    await repo.save(service);
    console.log("Service '企业公司信息查询' added successfully.");
    process.exit(0);
};

addService().catch((e) => {
    console.error("Failed to add service:", e);
    process.exit(1);
});
