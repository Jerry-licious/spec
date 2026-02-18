import {DataSource} from "typeorm";
import {UnitData} from "./schema";

let AppDataSource: DataSource;

export async function initialiseDatabase(dbPath: string) {
    AppDataSource = new DataSource({
        type: 'better-sqlite3',
        database: dbPath,
        entities: [UnitData],
        synchronize: true,
    });
    await AppDataSource.initialize();
}

