import { Request, Response } from 'express';
import { AppDataSource } from '../db';
import { UserMCPInstance } from '../entities/UserMCPInstance';
import InstanceManager from '../mcp/InstanceManager';

export class InstanceController {
    static async list(req: Request, res: Response) {
        try {
            const user = (req as any).user; // Set by auth middleware
            if (!user) return res.status(401).json({ message: "Unauthorized" });

            const repo = AppDataSource.getRepository(UserMCPInstance);
            const instances = await repo.find({ where: { userId: user.userId } });

            // Enrich with realtime status
            const result = instances.map(inst => ({
                ...inst,
                active: InstanceManager.getInstanceStatus(inst.id)
            }));

            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            if (!user) return res.status(401).json({ message: "Unauthorized" });

            const { serviceId, xiaozhiWssUrl, status } = req.body;

            // Basic validation
            if (!serviceId || !xiaozhiWssUrl) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            const repo = AppDataSource.getRepository(UserMCPInstance);
            const newInstance = repo.create({
                userId: user.userId,
                serviceId,
                xiaozhiWssUrl,
                status: status || 'stopped'
            });

            await repo.save(newInstance);
            return res.status(201).json(newInstance);

        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async start(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            const user = (req as any).user;

            const repo = AppDataSource.getRepository(UserMCPInstance);
            const instance = await repo.findOne({ where: { id, userId: user.userId } });

            if (!instance) return res.status(404).json({ message: "Instance not found" });

            // In real app, name might come from service definition
            const success = await InstanceManager.startInstance(instance.id, instance.xiaozhiWssUrl, `User_${user.userId}_Service`);

            if (success) {
                instance.status = 'running';
                instance.startTime = new Date();
                await repo.save(instance);
                return res.json({ message: "Instance started", instance });
            } else {
                instance.status = 'error';
                await repo.save(instance);
                return res.status(500).json({ message: "Failed to start instance" });
            }

        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async stop(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            const user = (req as any).user;

            const repo = AppDataSource.getRepository(UserMCPInstance);
            const instance = await repo.findOne({ where: { id, userId: user.userId } });

            if (!instance) return res.status(404).json({ message: "Instance not found" });

            const success = await InstanceManager.stopInstance(instance.id);

            instance.status = 'stopped';
            instance.startTime = undefined; // or keep last start time?
            await repo.save(instance);

            return res.json({ message: "Instance stopped", instance });
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            const user = (req as any).user;

            const repo = AppDataSource.getRepository(UserMCPInstance);
            const instance = await repo.findOne({ where: { id, userId: user.userId } });

            if (!instance) return res.status(404).json({ message: "Instance not found" });

            // Stop if running
            await InstanceManager.stopInstance(instance.id);

            await repo.remove(instance);
            return res.json({ message: "Instance deleted" });

        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }
}
