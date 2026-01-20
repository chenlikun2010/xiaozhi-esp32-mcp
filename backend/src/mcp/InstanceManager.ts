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

    public async startInstance(dbId: number, wssUrl: string, serviceName: string, userId: number): Promise<boolean> {
        if (this.activeInstances.has(dbId)) {
            console.log(`Instance ${dbId} is already running.`);
            return true;
        }

        const checkExpiry = async (): Promise<boolean> => {
            try {
                // Dynamic import to avoid circular dependency if any, or just use AppDataSource
                const { AppDataSource } = await import('../db');
                const { User } = await import('../entities/User');
                const userRepo = AppDataSource.getRepository(User);
                const user = await userRepo.findOneBy({ id: userId });
                if (!user) return true; // Block if user not found

                const now = new Date();
                const isExpired = new Date(user.expireDate) < now;
                if (isExpired) {
                    console.log(`User ${userId} expired at ${user.expireDate}. Blocking tool execution.`);
                }
                return isExpired;
            } catch (err) {
                console.error("Error checking expiry:", err);
                return false; // Default to allow if DB error? Or block? Safe to allow to avoid interruption on transient error?
                // But safer for business to block. Let's block on error for now or allow. 
                // Current Requirement: prompt expired.
                // Let's assume on error we don't block unless we know it's expired.
                return false;
            }
        };

        try {
            const mcpServer = new XiaozhiMCPServer(wssUrl, serviceName, checkExpiry, userId);
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
