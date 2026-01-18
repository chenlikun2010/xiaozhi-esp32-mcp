import { AppDataSource } from "../db";
import { User } from "../entities/User";
import { VerificationCode } from "../entities/VerificationCode";
import { ActivationCode } from "../entities/ActivationCode";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from 'uuid';

export class UserService {
    private userRepository = AppDataSource.getRepository(User);
    private verificationCodeRepository = AppDataSource.getRepository(VerificationCode);

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

    async changePassword(userId: number, oldPass: string, newPass: string): Promise<void> {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) throw new Error("User not found");

        const isValid = await bcrypt.compare(oldPass, user.password);
        if (!isValid) throw new Error("Incorrect old password");

        user.password = await bcrypt.hash(newPass, 10);
        await this.userRepository.save(user);
    }

    async createVerificationCode(email: string): Promise<string> {
        const user = await this.userRepository.findOneBy({ email });
        if (!user) throw new Error("User not found");

        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 min expiry

        // Delete existing codes for this email to keep clean
        await this.verificationCodeRepository.delete({ email });

        const verification = this.verificationCodeRepository.create({
            email,
            code,
            expiresAt
        });
        await this.verificationCodeRepository.save(verification);

        // TODO: Replace with real email service
        console.log(`[Mock Email] Verification code for ${email}: ${code}`);

        return code;
    }

    async verifyCode(email: string, code: string): Promise<boolean> {
        const record = await this.verificationCodeRepository.findOne({ where: { email, code } });
        if (!record) return false;

        if (record.expiresAt < new Date()) {
            await this.verificationCodeRepository.remove(record);
            return false;
        }

        return true;
    }

    async resetPassword(email: string, code: string, newPass: string): Promise<void> {
        const isValid = await this.verifyCode(email, code);
        if (!isValid) throw new Error("Invalid or expired verification code");

        const user = await this.userRepository.findOneBy({ email });
        if (!user) throw new Error("User not found");

        user.password = await bcrypt.hash(newPass, 10);
        await this.userRepository.save(user);

        // Invalidate code after use
        await this.verificationCodeRepository.delete({ email });
    }
    async activateUser(userId: number, code: string): Promise<User> {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) throw new Error("User not found");

        const activationRepo = AppDataSource.getRepository(ActivationCode);
        const activationCode = await activationRepo.findOneBy({ code });

        if (!activationCode) {
            throw new Error("Invalid activation code");
        }

        if (activationCode.isUsed) {
            throw new Error("Activation code has already been used");
        }

        // Calculate new expiry
        const currentExpire = new Date(user.expireDate);
        const now = new Date();

        // If already expired, start from now. If active, add to current expiry.
        let newExpire = currentExpire > now ? currentExpire : now;
        newExpire = new Date(newExpire.getTime() + activationCode.durationDays * 24 * 60 * 60 * 1000);

        user.expireDate = newExpire;
        await this.userRepository.save(user);

        // Mark code as used
        activationCode.isUsed = true;
        activationCode.usedBy = userId;
        activationCode.usedAt = new Date();
        await activationRepo.save(activationCode);

        return user;
    }
}
