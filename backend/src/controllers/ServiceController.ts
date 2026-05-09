import { Request, Response } from 'express';
import { AppDataSource } from '../db';
import { MCPService } from '../entities/MCPService';

export class ServiceController {
    static async list(req: Request, res: Response) {
        try {
            const repo = AppDataSource.getRepository(MCPService);
            const services = await repo.find();
            const visibleServices = services.filter(
                (svc) => !/(知识库|knowledge|rag)/i.test(`${svc.name} ${svc.description || ''}`)
            );
            return res.json(visibleServices);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }
}
