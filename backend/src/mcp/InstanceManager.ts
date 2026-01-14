import { XiaozhiMCPServer } from "./XiaozhiMCPServer";

class InstanceManager {
    private static instance: InstanceManager;
    private activeInstances: Map<number, XiaozhiMCPServer> = new Map();

    private constructor() { }

    public static getInstance(): InstanceManager {
        if (!InstanceManager.instance) {
            InstanceManager.instance = new InstanceManager();
        }
        return InstanceManager.instance;
    }

    public async startInstance(dbId: number, wssUrl: string, serviceName: string): Promise<boolean> {
        if (this.activeInstances.has(dbId)) {
            console.log(`Instance ${dbId} is already running.`);
            return true;
        }

        try {
            const mcpServer = new XiaozhiMCPServer(wssUrl, serviceName);
            await mcpServer.connect();
            this.activeInstances.set(dbId, mcpServer);
            return true;
        } catch (error) {
            console.error(`Failed to start instance ${dbId}:`, error);
            return false;
        }
    }

    public async stopInstance(dbId: number): Promise<boolean> {
        const mcpServer = this.activeInstances.get(dbId);
        if (!mcpServer) {
            console.log(`Instance ${dbId} is not running.`);
            return false;
        }

        await mcpServer.disconnect();
        this.activeInstances.delete(dbId);
        return true;
    }

    public getInstanceStatus(dbId: number): boolean {
        const mcpServer = this.activeInstances.get(dbId);
        return mcpServer ? mcpServer.getStatus().connected : false;
    }
}

export default InstanceManager.getInstance();
