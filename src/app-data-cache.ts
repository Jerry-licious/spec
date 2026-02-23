import {UnitData} from "~/db/unit-data";
import {getUnit, getUnits} from "~/app-data";
import {createCachedResource} from "solid-cached-resource";
import {Accessor, InitializedResourceReturn} from "solid-js";

export function createGetUnit(tag: Accessor<string | number>): InitializedResourceReturn<UnitData> {
    return createCachedResource(() => ['unit', tag()], async ([, tag]) => {
        const unit = await getUnit(tag);

        if (!unit) throw new Error('Unit not found.');

        return unit;
    })
}