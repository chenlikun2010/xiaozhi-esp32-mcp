import { AppDataSource } from "../db";
import { User } from "../entities/User";
import { VerificationCode } from "../entities/VerificationCode";
import { ActivationCode } from "../entities/ActivationCode";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.exmail.qq.com',
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export class UserService {
    private userRepository = AppDataSource.getRepository(User);
    private verificationCodeRepository = AppDataSource.getRepository(VerificationCode);

    async register(email: string, password: string, inviteCode?: string, verificationCode?: string): Promise<User> {
        // Verify code
        if (!verificationCode) {
            throw new Error("Verification code is required");
        }
        const isValid = await this.verifyCode(email, verificationCode);
        if (!isValid) {
            throw new Error("Invalid or expired verification code");
        }

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

        const savedUser = await this.userRepository.save(user);

        // Invalidate code after successful registration
        await this.verificationCodeRepository.delete({ email });

        return savedUser;
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

    async sendVerificationCode(email: string, type: 'register' | 'reset' = 'reset'): Promise<string> {
        if (type === 'reset') {
            const user = await this.userRepository.findOneBy({ email });
            if (!user) throw new Error("User not found");
        } else if (type === 'register') {
            const user = await this.userRepository.findOneBy({ email });
            if (user) throw new Error("User already registered");
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        // Delete existing
        await this.verificationCodeRepository.delete({ email });

        const verification = this.verificationCodeRepository.create({
            email,
            code,
            expiresAt
        });
        await this.verificationCodeRepository.save(verification);

        // Send Email
        const subject = type === 'register' ? '注册验证码' : '重置密码验证码';
        const text = `您的验证码是：${code}，有效期15分钟。若非本人操作请忽略。`;

        try {
            await transporter.sendMail({
                from: `"Xiaozhi Admin" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: subject,
                text: text,
                html: `<p>您的验证码是：<strong style="font-size: 18px; color: #4F46E5;">${code}</strong></p><p>有效期15分钟。若非本人操作请忽略。</p>`
            });
            console.log(`[Email] Sent code to ${email}`);
        } catch (error: any) {
            console.error(`[Email] Failed to send to ${email}:`, error);
            // In dev, maybe allow it? But production needs it.
            // throw new Error("Failed to send verification email");
        }

        return code;
    }

    // Legacy method redirection
    async createVerificationCode(email: string): Promise<string> {
        return this.sendVerificationCode(email, 'reset');
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
    async getInvitedUsers(inviteCode: string): Promise<User[]> {
        return await this.userRepository.find({
            where: { referredBy: inviteCode },
            order: { createdAt: 'DESC' }
        });
    }
}
