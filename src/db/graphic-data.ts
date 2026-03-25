import {Column, Entity, Index, PrimaryColumn} from "typeorm";

@Entity('graphic')
export class GraphicData {
    // Path relative to the working directory.
    @PrimaryColumn('text')
    path!: string;
    @Column('text')
    hash!: string;

    @Index()
    @Column('datetime')
    lastCopied!: Date;
}
