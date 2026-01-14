import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class MCPService {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column("text")
    description!: string;

    @Column({ name: 'image_url', nullable: true })
    imageUrl?: string;
}
