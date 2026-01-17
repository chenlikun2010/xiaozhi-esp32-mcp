import { AppDataSource, initializeDB } from '../db';
import { MCPService } from '../entities/MCPService';

const addService = async () => {
    await initializeDB();
    const repo = AppDataSource.getRepository(MCPService);

    const existing = await repo.findOne({ where: { name: "汇率查询助手" } });
    if (existing) {
        console.log("Service '汇率查询助手' already exists.");
        process.exit(0);
    }

    const service = repo.create({
        name: "汇率查询助手",
        description: "基于 Frankfurter API 的实时汇率查询与货币转换服务。支持 USD, CNY, EUR, JPY 等全球主流货币，完全免费。",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Globe_and_currency_symbols.jpg"
    });

    await repo.save(service);
    console.log("Service '汇率查询助手' added successfully.");
    process.exit(0);
};

addService().catch(console.error);
