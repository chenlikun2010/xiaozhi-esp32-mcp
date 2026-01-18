
import { Request, Response } from 'express';
import { AppDataSource } from '../db';
import { User } from '../entities/User';
import bcrypt from 'bcryptjs';

export class AdminController {

    // Get all users
    static async listUsers(req: Request, res: Response) {
        try {
            const repo = AppDataSource.getRepository(User);
            const users = await repo.find({
                order: { createdAt: "DESC" }
            });

            // Sanitize sensitive data
            const sanitized = users.map(u => ({
                id: u.id,
                email: u.email,
                role: u.role,
                expireDate: u.expireDate,
                invitationCode: u.invitationCode,
                createdAt: u.createdAt
            }));

            return res.json(sanitized);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    // Update user (e.g. role, expireDate, password)
    static async updateUser(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const { role, expireDate, password } = req.body;

            const repo = AppDataSource.getRepository(User);
            const user = await repo.findOneBy({ id });

            if (!user) return res.status(404).json({ message: "User not found" });

            if (role) user.role = role;
            if (expireDate) user.expireDate = new Date(expireDate);
            if (password) {
                user.password = await bcrypt.hash(password, 10);
            }

            await repo.save(user);

            return res.json({
                message: "User updated successfully", user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    expireDate: user.expireDate
                }
            });
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    // Create a new user (admin action)
    static async createUser(req: Request, res: Response) {
        try {
            const { email, password, role, expireDate } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }

            const repo = AppDataSource.getRepository(User);

            // Check existence
            const existing = await repo.findOneBy({ email });
            if (existing) return res.status(400).json({ message: "User already exists" });

            const hashedPassword = await bcrypt.hash(password, 10);

            // Generate random invite code
            const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            const user = repo.create({
                email,
                password: hashedPassword,
                role: role || 'user',
                invitationCode,
                expireDate: expireDate ? new Date(expireDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });

            await repo.save(user);
            return res.status(201).json({ message: "User created", user });

        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }
}
