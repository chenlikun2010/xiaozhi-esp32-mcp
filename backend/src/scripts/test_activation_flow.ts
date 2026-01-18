import axios from 'axios';
import { AppDataSource, initializeDB } from '../db';
import { ActivationCode } from '../entities/ActivationCode';

const API_URL = 'http://localhost:3005';

const run = async () => {
    try {
        // 0. Prepare DB and create a code
        await initializeDB();
        const codeRepo = AppDataSource.getRepository(ActivationCode);
        const testCode = 'VIP-TEST-' + Date.now();
        console.log(`Creating test code: ${testCode}`);

        await codeRepo.save({
            code: testCode,
            durationDays: 30,
            isUsed: false
        });

        // 1. Register
        const email = `test_real_${Date.now()}@example.com`;
        const password = 'password123';

        console.log(`Registering ${email}...`);
        const regRes = await axios.post(`${API_URL}/register`, { email, password });

        // Login to get token
        const loginRes = await axios.post(`${API_URL}/login`, { email, password });
        const token = (loginRes.data as any).token;
        console.log('Logged in, token obtained.');

        // 2. Activate
        console.log(`Activating with ${testCode}...`);
        const actRes = await axios.post(
            `${API_URL}/activate`,
            { code: testCode },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const newExpire = new Date((actRes.data as any).user.expireDate);
        console.log(`Activation successful. New Expiry: ${newExpire}`);

        // 3. Verify Code Usage
        const usedCode = await codeRepo.findOneBy({ code: testCode });
        if (usedCode && usedCode.isUsed) {
            console.log('PASS: Code marked as used in DB.');
        } else {
            console.log('FAIL: Code NOT marked as used.');
        }

        // 4. Verify Re-use fails
        try {
            await axios.post(
                `${API_URL}/activate`,
                { code: testCode },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('FAIL: Re-use should fail but succeeded.');
        } catch (e: any) {
            console.log('PASS: Re-use failed as expected: ' + e.response?.data?.message);
        }

        process.exit(0);
    } catch (error: any) {
        console.error('Test Failed:', error.response?.data || error.message);
        process.exit(1);
    }
};

run();
