// Script to rename service "今天吃什么？" to "菜谱查询"
import { AppDataSource, initializeDB } from '../db';
import { MCPService } from '../entities/MCPService';

const renameService = async () => {
    await initializeDB();
    const repo = AppDataSource.getRepository(MCPService);
    const service = await repo.findOne({ where: { name: '今天吃什么？' } });
    if (!service) {
        console.log('Service "今天吃什么？" not found.');
        process.exit(0);
    }
    service.name = '菜谱查询';
    await repo.save(service);
    console.log('Service renamed to "菜谱查询" successfully.');
    process.exit(0);
};

renameService().catch(console.error);
