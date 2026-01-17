import { AppDataSource, initializeDB } from '../db';
import { MCPService } from '../entities/MCPService';

const addService = async () => {
    await initializeDB();
    const repo = AppDataSource.getRepository(MCPService);

    const existing = await repo.findOne({ where: { name: "股票分析助手" } });
    if (existing) {
        console.log("Service '股票分析助手' already exists.");
        process.exit(0);
    }

    const service = repo.create({
        name: "股票分析助手",
        description: "基于 Yahoo Finance 的实时股票行情与历史数据查询服务。支持美股 (AAPL)、港股 (0700.HK) 等全球市场。",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Jamstec_stock_graph.gif"
    });

    await repo.save(service);
    console.log("Service '股票分析助手' added successfully.");
    process.exit(0);
};

addService().catch(console.error);
