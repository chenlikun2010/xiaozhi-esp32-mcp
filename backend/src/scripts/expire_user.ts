
import { AppDataSource, initializeDB } from '../db';
import { User } from '../entities/User';

const expireUser = async () => {
    const args = process.argv.slice(2);
    const email = args[0];

    await initializeDB();
    const repo = AppDataSource.getRepository(User);

    let user;
    if (email) {
        user = await repo.findOne({ where: { email } });
    } else {
        console.log("No email provided, expiring the first user found...");
        user = await repo.findOne({ where: {} });
    }

    if (user) {
        console.log(`Expiring user ${user.email} (ID: ${user.id})...`);
        console.log(`Current Expiry: ${user.expireDate}`);

        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1); // Yesterday
        user.expireDate = pastDate;

        await repo.save(user);
        console.log(`User expired. New Expiry: ${user.expireDate}`);
    } else {
        console.log("No user found.");
    }
    process.exit(0);
};

expireUser().catch(console.error);
