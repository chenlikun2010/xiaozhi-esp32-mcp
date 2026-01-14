import axios from 'axios';

const API_URL = 'http://127.0.0.1:3005';

async function testRegistration() {
    try {
        // 1. Register User A
        console.log("Registering User A...");
        const resA = await axios.post(`${API_URL}/register`, {
            email: `userA_${Date.now()}@example.com`,
            password: 'password123'
        });
        console.log("User A Registered:", resA.data);
        const dataA = resA.data as any;
        const inviteCodeA = dataA.user.inviteCode;
        const expiryA_initial = new Date(dataA.user.expireDate);

        // 2. Register User B with Invite Code A
        console.log(`Registering User B with invite code ${inviteCodeA}...`);
        const resB = await axios.post(`${API_URL}/register`, {
            email: `userB_${Date.now()}@example.com`,
            password: 'password123',
            inviteCode: inviteCodeA
        });
        console.log("User B Registered:", resB.data);

        // 3. Login as User A to check updated expiry
        console.log("Logging in as User A to check expiry...");
        const loginA = await axios.post(`${API_URL}/login`, {
            email: dataA.user.email,
            password: 'password123'
        });
        const loginDataA = loginA.data as any;
        const expiryA_updated = new Date(loginDataA.user.expireDate);

        console.log(`User A Initial Expiry: ${expiryA_initial.toISOString()}`);
        console.log(`User A Updated Expiry: ${expiryA_updated.toISOString()}`);

        if (expiryA_updated.getTime() > expiryA_initial.getTime()) {
            console.log("SUCCESS: User A expiry extended!");
        } else {
            console.log("FAILURE: User A expiry NOT extended.");
        }

    } catch (error: any) {
        console.error("Test Failed Message:", error.message);
        console.error("Test Failed Code:", error.code);
        if (error.response) {
            console.error("Response Status:", error.response.status);
            console.error("Response Data:", error.response.data);
        }
    }
}

testRegistration();
