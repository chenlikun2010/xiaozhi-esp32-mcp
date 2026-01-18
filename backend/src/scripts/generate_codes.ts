
import { AppDataSource, initializeDB } from '../db';
import { ActivationCode } from '../entities/ActivationCode';
import { v4 as uuidv4 } from 'uuid';

const generateCodes = async () => {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log("Usage: npx ts-node src/scripts/generate_codes.ts <count> <days>");
        process.exit(1);
    }

    const count = parseInt(args[0]);
    const durationDays = parseInt(args[1]);

    await initializeDB();
    const repo = AppDataSource.getRepository(ActivationCode);

    console.log(`Generating ${count} codes for ${durationDays} days...`);

    for (let i = 0; i < count; i++) {
        // Generate a readable but unique code: PREFIX-XXXX-XXXX
        const uniquePart = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
        // Split into chunks of 4 for readability
        const formatted = `VIP-${uniquePart.substring(0, 4)}-${uniquePart.substring(4, 8)}`;

        const code = repo.create({
            code: formatted,
            durationDays
        });
        await repo.save(code);
        console.log(formatted);
    }

    console.log("Done.");
    process.exit(0);
};

generateCodes().catch(console.error);
