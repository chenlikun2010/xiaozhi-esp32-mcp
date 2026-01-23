
import { AppDataSource } from "./db";
import { User } from "./entities/User";

async function listUsers() {
    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(User);
    const users = await repo.find();
    console.log("Users:", users.map(u => ({ id: u.id, email: u.email, role: u.role })));
    await AppDataSource.destroy();
}

listUsers();
