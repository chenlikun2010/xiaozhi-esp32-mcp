import { AppDataSource, initializeDB } from './db';
import { UserMCPInstance } from './entities/UserMCPInstance';

async function checkInstances() {
    await initializeDB();
    const repo = AppDataSource.getRepository(UserMCPInstance);
    const instances = await repo.find();
    console.log("Found instances:", JSON.stringify(instances, null, 2));
    process.exit(0);
}

checkInstances();
