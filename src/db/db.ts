import {DataSource} from "typeorm";
import {UnitData} from "./unit-data";
import {BibliographyData} from "./bib-data";
import consola from "consola";
import {loadConfig} from "~/load-configs";
import {config} from "~/configs";
import {AuxData} from "~/db/aux-data";

export let AppDataSource: DataSource;


export async function getDataSource(): Promise<DataSource> {
    if (AppDataSource && AppDataSource.isInitialized) return AppDataSource;

    if (!config) {
        await loadConfig();
    }
    await initialiseDatabase(config.database);

    return AppDataSource;
}


export async function initialiseDatabase(dbPath: string) {
    try {
        consola.start(`Initialising database from ${dbPath}.`);

        AppDataSource = new DataSource({
            type: 'better-sqlite3',
            database: dbPath,
            entities: [UnitData, BibliographyData, AuxData],
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

