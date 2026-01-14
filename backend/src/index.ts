import "reflect-metadata";
import express from 'express';
import { AppDataSource, initializeDB } from './db';
import dotenv from 'dotenv';

dotenv.config();

import { AuthController } from './controllers/AuthController';

const app = express();
const port = 3005;

app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

import { InstanceController } from './controllers/InstanceController';
import { ServiceController } from './controllers/ServiceController';
import { authMiddleware } from './middleware/auth';

// Routes
app.post('/register', AuthController.register);
app.post('/login', AuthController.login);
app.get('/services', authMiddleware, ServiceController.list);

// Instance Routes
app.get('/instances', authMiddleware, InstanceController.list);
app.post('/instances', authMiddleware, InstanceController.create);
app.post('/instances/:id/start', authMiddleware, InstanceController.start);
app.post('/instances/:id/stop', authMiddleware, InstanceController.stop);
app.delete('/instances/:id', authMiddleware, InstanceController.delete);

app.get('/', (req, res) => {
    res.send('Xiaozhi MCP Manager Backend');
});

import { UserMCPInstance } from './entities/UserMCPInstance';
import InstanceManager from './mcp/InstanceManager';

const startServer = async () => {
    await initializeDB();

    // Auto-start instances marked as 'running'
    try {
        const repo = AppDataSource.getRepository(UserMCPInstance);
        const runningInstances = await repo.find({ where: { status: 'running' } });

        console.log(`Found ${runningInstances.length} instances to auto-start.`);

        for (const inst of runningInstances) {
            console.log(`Auto-starting instance ${inst.id} (User: ${inst.userId})...`);
            // Assuming a default service name or derived one. The original start logic used "User_${user.userId}_Service"
            const serviceName = `User_${inst.userId}_Service`;
            const success = await InstanceManager.startInstance(inst.id, inst.xiaozhiWssUrl, serviceName);
            if (success) {
                console.log(`Instance ${inst.id} started successfully.`);
            } else {
                console.error(`Failed to auto-start instance ${inst.id}.`);
            }
        }
    } catch (error) {
        console.error("Error during auto-start of instances:", error);
    }

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
};

startServer();
