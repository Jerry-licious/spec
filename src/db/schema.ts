import {LinkTarget} from "./link-target";
import {Column, Entity, PrimaryColumn} from "typeorm";


@Entity('units')
export class UnitData {
    @PrimaryColumn('int')
    tag!: number;
    @Column('text')
    hash!: string;

    @Column('text')
    numberingText!: string;

    @Column('text')
    unitType!: string;
    @Column('text')
    unitName!: string;

    @Column('text', { nullable: true })
    titleText!: string | null;
    @Column('text', { nullable: true })
    titleHTML!: string | null;
    @Column('text')
    contentHTML!: string;

    @Column('datetime')
    lastRendered!: Date;

    @Column('simple-json')
    parentChain!: LinkTarget[];

    @Column('simple-json')
    directlyReferences!: LinkTarget[];
    @Column('simple-json')
    indirectlyReferences!: LinkTarget[];
    @Column('simple-json')
    directlyReferencedBy!: LinkTarget[];
    @Column('simple-json')
    indirectlyReferencedBy!: LinkTarget[];

    @Column('simple-json')
    children!: LinkTarget[];
}

