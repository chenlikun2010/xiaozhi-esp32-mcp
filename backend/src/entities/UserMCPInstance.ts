import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { MCPService } from "./MCPService";

@Entity()
export class UserMCPInstance {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'user_id' })
    userId!: number;

    @Column({ name: 'service_id' })
    serviceId!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => MCPService)
    @JoinColumn({ name: 'service_id' })
    service!: MCPService;

    @Column({ name: 'xiaozhi_wss_url', type: 'text' })
    xiaozhiWssUrl!: string;

    @Column({ default: 'stopped' }) // stopped, running, error
    status!: string;

    @Column({ name: 'start_time', type: 'datetime', nullable: true })
    startTime?: Date;

    @CreateDateColumn()
    createdAt!: Date;
}
