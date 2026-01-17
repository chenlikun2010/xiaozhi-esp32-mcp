import axios from 'axios';
import WebSocket, { WebSocketServer } from 'ws';

const API_URL = 'http://127.0.0.1:3005';
const MOCK_WSS_PORT = 8080;

async function runTest() {
    let wss: WebSocketServer | undefined;

    try {
        // 1. Start Mock WSS
        console.log("Starting Mock WSS...");
        wss = new WebSocketServer({ port: MOCK_WSS_PORT });
        wss.on('connection', (ws) => {
            console.log("Mock WSS: Client connected!");

            // Simulate MCP Client Handshake
            const send = (msg: any) => ws.send(JSON.stringify(msg));

            // 1. Send Initialize
            setTimeout(() => {
                console.log("Mock WSS: Sending initialize...");
                send({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "initialize",
                    params: {
                        protocolVersion: "2024-11-05",
                        capabilities: {},
                        clientInfo: { name: "test-client", version: "1.0" }
                    }
                });
            }, 500);

            ws.on('message', (message) => {
                const msgStr = message.toString();
                console.log("Mock WSS received:", msgStr);

                try {
                    const msg = JSON.parse(msgStr);
                    // 2. If we get initialize response, send initialized and ask for tools
                    if (msg.id === 1 && msg.result) {
                        console.log("Mock WSS: Received initialize response. Capabilities:", JSON.stringify(msg.result.capabilities));

                        // Send initialized notification
                        send({
                            jsonrpc: "2.0",
                            method: "notifications/initialized"
                        });

                        // Ask for tools
                        console.log("Mock WSS: Sending tools/list...");
                        send({
                            jsonrpc: "2.0",
                            id: 2,
                            method: "tools/list"
                        });
                    }

                    // 3. Check tool list response
                    if (msg.id === 2 && msg.result) {
                        console.log("Mock WSS: Received Tool List:", JSON.stringify(msg.result));
                    }

                } catch (e) {
                    console.error("Mock WSS: Error parsing message", e);
                }
            });
        });

        // 2. Register/Login
        console.log("Registering User...");
        const email = `test_${Date.now()}@example.com`;
        await axios.post(`${API_URL}/register`, { email, password: 'password' });

        console.log("Logging in...");
        const loginRes = await axios.post(`${API_URL}/login`, { email, password: 'password' });
        const loginData = loginRes.data as any;
        const token = loginData.token;
        const headers = { Authorization: `Bearer ${token}` };

        // 3. Create Instance
        console.log("Creating Instance...");
        const createRes = await axios.post(`${API_URL}/instances`, {
            serviceId: 1,
            xiaozhiWssUrl: `ws://127.0.0.1:${MOCK_WSS_PORT}`,
            status: 'stopped'
        }, { headers });
        const createData = createRes.data as any;
        const instanceId = createData.id;
        console.log("Instance Created:", instanceId);

        // 4. Start Instance
        console.log("Starting Instance...");
        const startRes = await axios.post(`${API_URL}/instances/${instanceId}/start`, {}, { headers });
        console.log("Start Response:", startRes.data);

        // Wait a bit for connection
        await new Promise(r => setTimeout(r, 2000));

        // 5. List Instances to check status
        console.log("Listing Instances...");
        const listRes = await axios.get(`${API_URL}/instances`, { headers });
        const listData = listRes.data as any[];
        const inst = listData.find((i: any) => i.id === instanceId);
        console.log("Instance Status in DB:", inst.status);
        console.log("Instance Active Status (Realtime):", inst.active);

        if (inst.active) {
            console.log("SUCCESS: Instance is active/connected.");
        } else {
            console.error("FAILURE: Instance is not active.");
        }

        // 6. Stop Instance
        console.log("Stopping Instance...");
        await axios.post(`${API_URL}/instances/${instanceId}/stop`, {}, { headers });
        console.log("Instance Stopped.");

    } catch (error: any) {
        console.error("Test Failed:", error.message);
        if (error.response) {
            console.error("Response:", error.response.data);
        }
    } finally {
        wss?.close();
    }
}

runTest();
