import {DataSource} from "typeorm";
import {UnitData} from "./unit-data";
import {BibliographyData} from "./bib-data";

export let AppDataSource: DataSource;

export async function initialiseDatabase(dbPath: string) {
    AppDataSource = new DataSource({
        type: 'better-sqlite3',
        database: dbPath,
        entities: [UnitData, BibliographyData],
        synchronize: true,
    });
    await AppDataSource.initialize();
}

