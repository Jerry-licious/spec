import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity('bib')
export class BibliographyData {
    @PrimaryColumn('int')
    tag!: number;
    @Column('text')
    key!: string;

    // "Primary" data that I care enough to name.
    @Column('text')
    author!: string;
    @Column('text')
    title!: string;
    @Column('text')
    year!: string;
    @Column('text')
    publisher!: string;

    @Column('simple-json')
    // Auxiliary data that I don't care enough to name.
    aux!: Record<string, string>
}
