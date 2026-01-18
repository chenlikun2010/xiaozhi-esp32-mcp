
import { AppDataSource, initializeDB } from '../db';
import { ActivationCode } from '../entities/ActivationCode';

const checkCode = async () => {
    const args = process.argv.slice(2);
    const codeStr = args[0];

    if (!codeStr) {
        console.log("Usage: npx ts-node src/scripts/check_code.ts <code_string>");
        process.exit(1);
    }

    await initializeDB();
    const repo = AppDataSource.getRepository(ActivationCode);

    console.log(`Checking code: '${codeStr}'`);
    const code = await repo.findOneBy({ code: codeStr });

    if (code) {
        console.log("Found Code:", JSON.stringify(code, null, 2));
    } else {
        console.log("Code NOT found in database.");
        // List all codes to be sure
        const all = await repo.find();
        console.log("Available codes:", all.map(c => c.code));
    }

    process.exit(0);
};

checkCode().catch(console.error);
