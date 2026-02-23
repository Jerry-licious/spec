'use server';

// App related database functions. Stored separately from the other database functions to avoid accidentally importing
// server-related elements when compiling.

import {AppDataSource} from "./db";
import {fromTagString, toTagString} from "./tag";
import {createCachedResource, mutateCachedValue} from "solid-cached-resource";
import {Accessor, InitializedResourceReturn} from "solid-js";
import {query, redirect} from "@solidjs/router";
import {config} from "./configs";
import {In} from "typeorm";
import consola from "consola";
import {UnitData} from "~/db/unit-data";
import {getDataSource} from "~/db/db";


export const getConfig = query(async () => {
    return config;
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
    const dataSource = await getDataSource();
    return await dataSource.getRepository(UnitData).findBy({
        tag: In(tags)
    });
}

export async function cacheRelatedUnits(unit: UnitData) {
    const relatedUnits = await getUnits([
        ...(unit.children ?? []),
        ...unit.directlyReferences,
        ...unit.directlyReferencedBy,
        ...unit.indirectlyReferences,
        ...unit.indirectlyReferencedBy
    ].map((t) => t.tag));

    consola.log('Cache related units related to the server. ');

    for (const related of relatedUnits) {
        // 1. Tags are queried by their strings, so the conversion is useful here.
        // 2. Restructure the item to avoid hydration problems.
        mutateCachedValue(() => ['unit', toTagString(related.tag)], {...related});
    }
}
