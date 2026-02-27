import {toLinkTarget, UnitData} from "~/db/unit-data";
import {getConfig, getUnits} from "~/app-data";
import {createCachedResource, mutateCachedValue} from "solid-cached-resource";
import {Accessor, InitializedResourceReturn} from "solid-js";
import {fromTagString, toTagString} from "~/tag";
import {getDataSource} from "~/db/db";
import {query} from "@solidjs/router";
import {BibliographyData} from "~/db/bib-data";
import {AuxData} from "~/db/aux-data";
import consola from "consola";
import {In} from "typeorm";


// I doubt someone will be browsing back and forth between bibliography entries, so a query should be sufficient.
export const getBibliography = query(async (tag: string | number) => {
    'use server';

    if (typeof tag === 'string') {
        try {
            tag = fromTagString(tag);
        } catch (e) {
            return null;
        }
    }

    const dataSource = await getDataSource();
    const entry = await dataSource.getRepository(BibliographyData).findOneBy({ tag: tag });

    if (!entry) {
        new Error('Bibliography entry not found.');
    }

    // Strip the unit of all non-serialisable data.
    return {...entry};
}, 'bibliography');


export const getAllBibliography = query(async () => {
    'use server';

    const dataSource = await getDataSource();
    return (await dataSource.getRepository(BibliographyData).find({}))
        .map((e) => ({...e})) // Strip of non-serialisable data.
        // The sorting here is mostly for presentation, so I will not be so rigorous.
        .sort((a, b) => {
            const authorComp = a.author.localeCompare(b.author);
            if (authorComp != 0) return authorComp;

            const aYear = parseInt(a.year) || 0;
            const bYear = parseInt(b.year) || 0;
            const yearComp = aYear - bYear;
            if (yearComp != 0) return yearComp;

            return a.title.localeCompare(b.title);
        });
}, 'allBibliography');


export const getPreamble = query(async () => {
    'use server';

    return await getDataSource()
        .then((d) => d.getRepository(AuxData).findOneBy({key: 'preamble'}))
        .then((r) => r ? r.value : '');
}, 'preamble');


export const searchUnits = query(async (term: string) => {
    'use server';

    term = term.trim(); // Just in case.
    if (!term) return [];

    const dataSource = await getDataSource();
    const config = await getConfig();

    return (await dataSource.query<UnitData[]>(`
    SELECT u.* FROM units u
    INNER JOIN units_fts ON units_fts.rowid = u.tag
    WHERE units_fts MATCH ?
    ORDER BY units_fts.rank
    LIMIT ?
    `, [term, config.website.searchLimit]))
        .map((u) => toLinkTarget(u));
}, 'searchUnits');


export function createGetUnit(tag: Accessor<string | number>): InitializedResourceReturn<UnitData> {
    return createCachedResource(() => ['unit', tag()], async ([, tag]) => {
        const unit = await getUnit(tag);
        console.log('fetching', tag);

        if (!unit) throw new Error('Unit not found.');

        return unit;
    }, { refetchOnMount: false });
}

export const getUnit = query(async (tag: string | number) => {
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

        if (!unit) throw new Error('Unit not found.');

        // Strip the unit of all non-serialisable data.
        return {...unit};
    }
, 'unit');
