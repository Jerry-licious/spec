import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity('aux')
export class AuxData {
    @PrimaryColumn('text')
    key!: string;
    @Column('text')
    value!: string;
}
