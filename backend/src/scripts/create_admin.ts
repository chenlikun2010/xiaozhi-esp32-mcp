
import { AppDataSource, initializeDB } from '../db';
import { User } from '../entities/User';
import bcrypt from 'bcryptjs';

const createAdmin = async () => {
    const args = process.argv.slice(2);
    const email = args[0];
    const password = args[1];

    if (!email || !password) {
        console.log("Usage: npx ts-node src/scripts/create_admin.ts <email> <password>");
        process.exit(1);
    }

    await initializeDB();
    const repo = AppDataSource.getRepository(User);

    console.log(`Creating Admin User: ${email}`);

    // Check if exists
    let user = await repo.findOneBy({ email });
    if (user) {
        console.log("User already exists. Promoting to admin...");
        user.role = 'admin';
        user.password = await bcrypt.hash(password, 10); // Update password too
        await repo.save(user);
        console.log("User promoted to Admin.");
    } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = repo.create({
            email,
            password: hashedPassword,
            role: 'admin',
            invitationCode: 'ADMIN',
            expireDate: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000) // 10 years
        });
        await repo.save(user);
        console.log("New Admin User created.");
    }

    process.exit(0);
};

createAdmin().catch(console.error);
