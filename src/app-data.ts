'use server';

// App related database functions. Stored separately from the other database functions to avoid accidentally importing
// server-related elements when compiling.

import {fromTagString} from "./tag";
import {query} from "@solidjs/router";
import {config} from "./config";
import {In} from "typeorm";
import {UnitData} from "~/db/unit-data";
import {getDataSource} from "~/db/db";
import {loadConfig} from "~/load-config";


export const getConfig = query(async () => {
    'use server';

    if (!config) {
        await loadConfig();
    }

    return {...config};
}, 'config');




export async function getUnits(tags: number[]): Promise<UnitData[]> {
    'use server';

    const dataSource = await getDataSource();
    return (await dataSource.getRepository(UnitData).findBy({
        tag: In(tags)
    })).map((u) => ({...u}));
}
