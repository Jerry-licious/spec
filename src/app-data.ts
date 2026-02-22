// App related database functions. Stored separately from the other database functions to avoid accidentally importing
// server-related elements when compiling.

import {AppDataSource, UnitData} from "./db";
import {fromTagString} from "./tag";
import {createCachedResource} from "solid-cached-resource";
import {Accessor, InitializedResourceReturn} from "solid-js";
import {query} from "@solidjs/router";
import {config} from "./configs";


export const getConfig = query(async () => {
    return config;
}, 'config');


export async function getUnit(tag: string | number): Promise<UnitData | null> {
    if (typeof tag === 'string') {
        try {
            tag = fromTagString(tag);
        } catch (e) {
            return null;
        }
    }

    const unit = await AppDataSource.getRepository(UnitData).findOneBy({ tag: tag });

    // Strip the unit of all non-serialisable data.
    return unit ? {...unit} : null;
}

export function createGetUnit(tag: Accessor<string | number>): InitializedResourceReturn<UnitData | null> {
    return createCachedResource(['unit', tag()], async ([, tag]) => getUnit(tag))
}
