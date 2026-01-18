import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class ActivationCode {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    code!: string;

    @Column()
    durationDays!: number;

    @Column({ default: false })
    isUsed!: boolean;

    @Column({ nullable: true })
    usedBy!: number; // User ID

    @Column({ nullable: true })
    usedAt!: Date;

    @CreateDateColumn()
    createdAt!: Date;
}
