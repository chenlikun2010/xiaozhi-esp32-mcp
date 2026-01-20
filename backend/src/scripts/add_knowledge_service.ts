/**
 * 添加"个人知识库检索"服务到数据库
 */
import 'dotenv/config';
import { AppDataSource, initializeDB } from '../db';
import { MCPService } from '../entities/MCPService';

async function main() {
    await initializeDB();

    const serviceRepo = AppDataSource.getRepository(MCPService);

    // Check if exists
    const existing = await serviceRepo.findOne({ where: { name: '个人知识库助手' } });
    if (existing) {
        console.log('Service already exists:', existing);
        process.exit(0);
    }

    const service = serviceRepo.create({
        name: '个人知识库助手',
        description: '检索您上传的私人文档，为您的问题提供个性化解答。支持 PDF、Word、PPT、Excel、TXT 等格式。',
        imageUrl: '/knowledge_base.png'
    });

    await serviceRepo.save(service);
    console.log('Service added successfully:', service);

    process.exit(0);
}

main().catch(console.error);
