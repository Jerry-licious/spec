'use server';

// App related database functions. Stored separately from the other database functions to avoid accidentally importing
// server-related elements when compiling.

import {fromTagString} from "./tag";
import {query} from "@solidjs/router";
import {config} from "./configs";
import {In} from "typeorm";
import {toLinkTarget, UnitData} from "~/db/unit-data";
import {getDataSource} from "~/db/db";
import {loadConfig} from "~/load-configs";
import {LinkTarget} from "~/db/link-target";


export const getConfig = query(async () => {
    'use server';

    if (!config) {
        await loadConfig();
    }

    return {...config};
}, 'config');

export async function getUnit(tag: string | number): Promise<UnitData | null> {
    'use server';

    if (typeof tag === 'string') {
        try {
            tag = fromTagString(tag);
        } catch (e) {
            return null;
        }
    }

    const dataSource = await getDataSource();
    const unit = await dataSource.getRepository(UnitData).findOneBy({ tag: tag });

    // Strip the unit of all non-serialisable data.
    return unit ? {...unit} : null;
}


export async function getUnits(tags: number[]): Promise<UnitData[]> {
    'use server';

    const dataSource = await getDataSource();
    return (await dataSource.getRepository(UnitData).findBy({
        tag: In(tags)
    })).map((u) => ({...u}));
}


