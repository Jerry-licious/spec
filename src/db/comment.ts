import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {UnitData} from "./unit-data";

@Entity('comment')
export class CommentData {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text')
    author!: string;
    @Column('text')
    authorEmail!: string;
    @Column('datetime')
    posted!: Date;

    @Column('text')
    raw!: string;
    @Column('text')
    html!: string;

    @ManyToOne(() => UnitData, (unit) => unit.comments)
    unit!: UnitData;
}