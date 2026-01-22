import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userService = new UserService();
const JWT_SECRET = process.env.JWT_SECRET || 'xiaozhi-secret-key';

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            const { email, password, inviteCode } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }

            const user = await userService.register(email, password, inviteCode);
            return res.status(201).json({
                message: "User registered successfully",
                user: {
                    email: user.email,
                    inviteCode: user.invitationCode,
                    expireDate: user.expireDate
                }
            });
        } catch (error: any) {
            console.error("Register Error:", error);
            return res.status(400).json({ message: error.message });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const user = await userService.findByEmail(email);

            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role || 'user' },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.json({
                token,
                user: {
                    email: user.email,
                    role: user.role || 'user',
                    inviteCode: user.invitationCode,
                    expireDate: user.expireDate
                }
            });
        } catch (error: any) {
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async changePassword(req: Request, res: Response) {
        try {
            const { oldPassword, newPassword } = req.body;
            // @ts-ignore
            const userId = req.user?.userId;

            if (!userId || !oldPassword || !newPassword) {
                return res.status(400).json({ message: "Missing fields" });
            }

            await userService.changePassword(userId, oldPassword, newPassword);
            return res.json({ message: "Password updated successfully" });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async requestPasswordReset(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ message: "Email is required" });

            // This will throw if user not found, which is fine security-wise for INTERNAL tool, 
            // but for public API usually we return 200 regardless. Let's return 400 for better UX here.
            await userService.createVerificationCode(email);

            return res.json({ message: "Verification code sent to email (Mock: Check console)" });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async resetPassword(req: Request, res: Response) {
        try {
            const { email, code, newPassword } = req.body;
            if (!email || !code || !newPassword) {
                return res.status(400).json({ message: "Missing fields" });
            }

            await userService.resetPassword(email, code, newPassword);
            return res.json({ message: "Password reset successfully" });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async activate(req: Request, res: Response) {
        try {
            const { code } = req.body;
            // @ts-ignore
            const userId = req.user?.userId;

            if (!userId || !code) {
                return res.status(400).json({ message: "Missing fields" });
            }

            const user = await userService.activateUser(userId, code);
            return res.json({
                message: "Account activated successfully",
                user: {
                    email: user.email,
                    inviteCode: user.invitationCode,
                    expireDate: user.expireDate
                }
            });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async getInvitedUsers(req: Request, res: Response) {
        try {
            // @ts-ignore
            const user = req.user;
            // Need to fetch full user to get invite code if not in token, 
            // but usually it is in token or we fetch it. 
            // Let's rely on fetching user from DB to be safe or just use token if available.
            // The token logic in login puts inviteCode in the payload? 
            // Let's check logic: token has { userId, email, role }. It does NOT have inviteCode.

            const fullUser = await userService.findByEmail(user.email);
            if (!fullUser) return res.status(404).json({ message: "User not found" });

            const invitedUsers = await userService.getInvitedUsers(fullUser.invitationCode);

            // Format response
            const responseData = invitedUsers.map(u => {
                // Mask email: k***9 (first char + *** + last char) or similar
                const emailParts = u.email.split('@');
                const namePart = emailParts[0];
                let maskedName = namePart;
                if (namePart.length > 2) {
                    maskedName = namePart[0] + '***' + namePart[namePart.length - 1];
                } else {
                    maskedName = namePart[0] + '***';
                }

                return {
                    email: maskedName, // displaying as "受邀用户"
                    giftDays: 7, // Fixed as per logic
                    createdAt: u.createdAt,
                    expireDate: u.expireDate
                };
            });

            return res.json(responseData);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }
}
