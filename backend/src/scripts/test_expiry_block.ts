
import axios from 'axios';
import { AppDataSource, initializeDB } from '../db';
import { User } from '../entities/User';
import { UserMCPInstance } from '../entities/UserMCPInstance';

const API_URL = 'http://localhost:3005';

const run = async () => {
    try {
        await initializeDB();

        // 1. Create a User directly in DB
        const userRepo = AppDataSource.getRepository(User);
        const email = `expiry_test_${Date.now()}@test.com`;
        const user = userRepo.create({
            email,
            password: 'hashed_password', // won't use for login if we can fake token/or just modify known user
            expireDate: new Date(Date.now() - 100000), // Expired
            invitationCode: 'TEST',
        });
        await userRepo.save(user); // Saved with expired date

        // 2. Create an Instance directly
        const instRepo = AppDataSource.getRepository(UserMCPInstance);
        const instance = instRepo.create({
            userId: user.id,
            serviceId: 1, // assume service 1 exists
            xiaozhiWssUrl: "wss://mock.url",
            status: 'stopped'
        });
        await instRepo.save(instance);

        // 3. Try to Start via API - Should Fail
        console.log(`Attempting to start instance for expired user ${user.id}...`);

        // Need a valid token for this user to hit the API, OR just mock the controller test?
        // Generating token manually to skip login
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ userId: user.id, email: user.email }, 'xiaozhi-secret-key');

        try {
            await axios.post(
                `${API_URL}/instances/${instance.id}/start`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("FAIL: Start should have been blocked!");
        } catch (e: any) {
            if (e.response && e.response.status === 403) {
                console.log("PASS: Blocked with 403 as expected: " + e.response.data.message);
            } else {
                console.log("FAIL: Unexpected error:", e.message);
            }
        }

        // Clean up
        await instRepo.remove(instance);
        await userRepo.remove(user);

        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

run();
