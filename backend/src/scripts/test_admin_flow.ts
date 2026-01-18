
import axios from 'axios';
import { AppDataSource, initializeDB } from '../db';
import { User } from '../entities/User';
import bcrypt from 'bcryptjs';

const API_URL = 'http://localhost:3005';

const run = async () => {
    try {
        await initializeDB();

        // 1. Create Admin directly via DB (simulating script)
        const userRepo = AppDataSource.getRepository(User);
        const email = `admin_test_${Date.now()}@test.com`;
        const password = 'adminpassword';

        const existing = await userRepo.findOneBy({ email });
        if (existing) await userRepo.remove(existing);

        const adminUser = userRepo.create({
            email,
            password: await bcrypt.hash(password, 10),
            role: 'admin',
            invitationCode: 'ADMINTEST',
            expireDate: new Date()
        });
        await userRepo.save(adminUser);
        console.log(`Created admin: ${email}`);

        // 2. Login as Admin
        const loginRes = await axios.post(`${API_URL}/login`, { email, password });
        const token = (loginRes.data as any).token;
        const role = (loginRes.data as any).user.role;

        if (role !== 'admin') throw new Error("Login did not return admin role");
        console.log("PASS: Admin login successful.");

        // 3. Test Admin API (List Users)
        const listRes = await axios.get(`${API_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (Array.isArray(listRes.data) && listRes.data.length > 0) {
            console.log(`PASS: Fetched ${listRes.data.length} users.`);
        } else {
            throw new Error("Failed to list users");
        }

        // 4. Test Code Gen
        const genRes = await axios.post(`${API_URL}/admin/codes/generate`, {
            count: 2,
            durationDays: 1
        }, { headers: { Authorization: `Bearer ${token}` } });

        if ((genRes.data as any).codes.length === 2) {
            console.log("PASS: Generated 2 codes.");
        } else {
            throw new Error("Failed to generate codes");
        }

        // Cleanup
        await userRepo.remove(adminUser);
        process.exit(0);

    } catch (error: any) {
        console.error("FAIL:", error.response?.data || error.message);
        process.exit(1);
    }
}

run();
