import { AppDataSource, initializeDB } from '../db';
import { MCPService } from '../entities/MCPService';

const addService = async () => {
    await initializeDB();
    const repo = AppDataSource.getRepository(MCPService);

    const name = "企业公司信息查询";
    const existing = await repo.findOne({ where: { name } });
    if (existing) {
        console.log(`Service '${name}' already exists.`);
        process.exit(0);
    }

    const service = repo.create({
        name,
        description: "支持企业基础信息检索、股权结构等查询，基于远端 MCP 企业信息工具。",
        imageUrl: "https://cdn-icons-png.flaticon.com/512/1522/1522449.png"
    });

    await repo.save(service);
    console.log(`Service '${name}' added successfully.`);
    process.exit(0);
};

addService().catch(console.error);
