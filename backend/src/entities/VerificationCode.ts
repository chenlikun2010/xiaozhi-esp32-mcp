import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class VerificationCode {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    email!: string;

    @Column()
    code!: string;

    @Column()
    expiresAt!: Date;

    @CreateDateColumn()
    createdAt!: Date;
}
