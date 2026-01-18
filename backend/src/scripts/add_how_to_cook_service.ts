import { AppDataSource, initializeDB } from '../db';
import { MCPService } from '../entities/MCPService';

const addService = async () => {
    await initializeDB();
    const repo = AppDataSource.getRepository(MCPService);

    const oldName = "程序员做饭指南 (HowToCook)";
    const newName = "今天吃什么？";

    let service = await repo.findOne({ where: { name: oldName } });

    if (service) {
        console.log(`Renaming service from '${oldName}' to '${newName}'...`);
        service.name = newName;
    } else {
        service = await repo.findOne({ where: { name: newName } });
        if (service) {
            console.log(`Service '${newName}' already exists. Updating details...`);
        } else {
            console.log(`Creating new service '${newName}'...`);
            service = repo.create({ name: newName });
        }
    }

    service.description = "不知道吃什么？让 AI 帮你推荐！";
    service.imageUrl = "https://github.com/Anduin2017/HowToCook/raw/master/README.md";

    await repo.save(service);
    console.log(`Service '${newName}' saved successfully.`);
    process.exit(0);
};

addService().catch(console.error);
