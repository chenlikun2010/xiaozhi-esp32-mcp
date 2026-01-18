
import { Request, Response } from 'express';
import { AppDataSource } from '../db';
import { ActivationCode } from '../entities/ActivationCode';
import { v4 as uuidv4 } from 'uuid';

export class CodeController {

    static async listCodes(req: Request, res: Response) {
        try {
            const repo = AppDataSource.getRepository(ActivationCode);
            // Show latest first
            const codes = await repo.find({
                order: { createdAt: "DESC" },
                take: 100 // Cap at 100 for now or implement pagination
            });
            return res.json(codes);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async generateCodes(req: Request, res: Response) {
        try {
            const { count, durationDays } = req.body;

            if (!count || !durationDays) {
                return res.status(400).json({ message: "Count and Duration Days are required" });
            }

            const repo = AppDataSource.getRepository(ActivationCode);
            const createdCodes = [];

            for (let i = 0; i < count; i++) {
                const uniquePart = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
                const formatted = `VIP-${uniquePart.substring(0, 4)}-${uniquePart.substring(4, 8)}`;

                const code = repo.create({
                    code: formatted,
                    durationDays
                });
                await repo.save(code);
                createdCodes.push(code);
            }

            return res.json({ message: `${count} codes generated`, codes: createdCodes });
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }
}
