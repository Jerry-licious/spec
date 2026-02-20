import {DataSource} from "typeorm";
import {UnitData} from "./unit-data";
import {BibliographyData} from "./bib-data";
import consola from "consola";

export let AppDataSource: DataSource;

export async function initialiseDatabase(dbPath: string) {
    try {
        consola.start(`Initialising database from ${dbPath}.`);

        AppDataSource = new DataSource({
            type: 'better-sqlite3',
            database: dbPath,
            entities: [UnitData, BibliographyData],
            synchronize: true,
        });
        await AppDataSource.initialize();

        consola.success(`Successfully initialised database.`);
    } catch (error) {
        consola.error('Failed to initialize database.');
        console.error(error);

        process.exit(41);
    }
}

