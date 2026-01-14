import { Request, Response } from 'express';
import { AppDataSource } from '../db';
import { MCPService } from '../entities/MCPService';

export class ServiceController {
    static async list(req: Request, res: Response) {
        try {
            const repo = AppDataSource.getRepository(MCPService);
            const services = await repo.find();
            return res.json(services);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }
}
