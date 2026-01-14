import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { MCPService } from "./entities/MCPService";
import { UserMCPInstance } from "./entities/UserMCPInstance";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "8.140.51.220",
    port: 3306,
    username: "mcpadmin",
    password: "Mcp@20260109",
    database: "mcplist",
    synchronize: true, // Auto-create tables for dev
    logging: false,
    entities: [User, MCPService, UserMCPInstance],
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
