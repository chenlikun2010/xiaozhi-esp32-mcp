import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { MCPService } from "./entities/MCPService";
import { UserMCPInstance } from "./entities/UserMCPInstance";
import { VerificationCode } from './entities/VerificationCode';

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "mcplist",
    synchronize: true, // Auto-schema sync for dev
    logging: false,
    entities: [MCPService, UserMCPInstance, User, VerificationCode],
    subscribers: [],
    migrations: [],
});

export const initializeDB = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");
    } catch (err) {
        console.error("Error during Data Source initialization", err);
        process.exit(1);
    }
};
