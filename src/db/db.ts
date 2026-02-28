import {DataSource} from "typeorm";
import {UnitData} from "./unit-data";
import {BibliographyData} from "./bib-data";
import consola from "consola";
import {loadConfig} from "../load-config";
import {config} from "../config";
import {AuxData} from "../db/aux-data";
import {join, resolve} from "node:path";

export let AppDataSource: DataSource;
let dataSourcePromise: Promise<DataSource> | null = null;

export async function getDataSource(): Promise<DataSource> {
    if (AppDataSource && AppDataSource.isInitialized) return AppDataSource;

    if (!config) {
        await loadConfig();
    }

    if (dataSourcePromise) return dataSourcePromise;

    dataSourcePromise = initialiseDatabase(resolve(process.cwd(), config.database));

    return dataSourcePromise;
}


export async function initialiseDatabase(dbPath: string): Promise<DataSource> {
    try {
        consola.start(`Initialising database from ${dbPath}.`);

        AppDataSource = new DataSource({
            type: 'better-sqlite3',
            database: dbPath,
            entities: [UnitData, BibliographyData, AuxData],
            synchronize: true,
        });
        const result = await AppDataSource.initialize();

        consola.success(`Successfully initialised database.`);

        return result;
    } catch (error) {
        consola.error('Failed to initialize database.');
        console.error(error);

        process.exit(41);
    }
}

