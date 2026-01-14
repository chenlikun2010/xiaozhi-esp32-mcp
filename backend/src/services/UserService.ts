import { AppDataSource } from "../db";
import { User } from "../entities/User";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from 'uuid';

export class UserService {
    private userRepository = AppDataSource.getRepository(User);

    async register(email: string, password: string, inviteCode?: string): Promise<User> {
        // Check if user exists
        const existingUser = await this.userRepository.findOneBy({ email });
        if (existingUser) {
            throw new Error("User already exists");
        }

        // Validate invite code and calculate expiry
        let expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 7); // Default 7 days

        let referredBy = undefined;

        if (inviteCode) {
            const inviter = await this.userRepository.findOneBy({ invitationCode: inviteCode });
            if (inviter) {
                // Extend inviter's expiry by 7 days
                const inviterExpire = new Date(inviter.expireDate);
                // If inviter already expired, start from now + 7 days, else add to existing
                if (inviterExpire < new Date()) {
                    inviterExpire.setTime(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
                } else {
                    inviterExpire.setDate(inviterExpire.getDate() + 7);
                }
                inviter.expireDate = inviterExpire;
                await this.userRepository.save(inviter);

                // Bonus for new user: +7 days?
                // Requirement says: "邀请成功后，邀请人与被邀请人的服务使用期限同步延长 7 天。"
                // Use default 7 days + 7 days bonus = 14 days
                expireDate.setDate(expireDate.getDate() + 7);

                referredBy = inviter.invitationCode;
            } else {
                // Invalid invite code? Throw error or ignore? 
                // Usually ignore or throw. Let's throw for bad UX prevention
                throw new Error("Invalid invitation code");
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newInvitationCode = uuidv4().substring(0, 8).toUpperCase(); // Simple 8-char code

        const user = this.userRepository.create({
            email,
            password: hashedPassword,
            invitationCode: newInvitationCode,
            referredBy,
            expireDate
        });

        return await this.userRepository.save(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.userRepository.findOneBy({ email });
    }
}
