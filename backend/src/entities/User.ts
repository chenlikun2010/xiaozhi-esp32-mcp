import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @Column({ default: 'user' })
    role!: string;

    @Column({ unique: true, name: 'invitation_code' })
    invitationCode!: string;

    @Column({ name: 'referred_by', nullable: true })
    referredBy?: string;

    @Column({ name: 'expire_date', type: 'datetime' })
    expireDate!: Date;

    @Column({ name: 'knowledge_enabled', default: false })
    knowledgeEnabled!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
