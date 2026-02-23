import {Title} from "@solidjs/meta";
import {createAsync, redirect, useNavigate, useParams} from "@solidjs/router";
import {UnitPage} from "~/components/UnitPage";
import {getConfig, getUnits} from "~/app-data";
import {createEffect, ErrorBoundary, onMount, Show} from "solid-js";
import {mutateCachedValue} from "solid-cached-resource";
import {toTagString} from "~/tag";
import {createGetUnit} from "~/app-data-cache";



export const route = {
    preload: ({ params }: {  params: { tag: string } }) => {
        getConfig();
        createGetUnit(() => params.tag);
    },
};


export default function UnitView() {
    const params = useParams<{tag: string}>();

    const [unitAccessor] = createGetUnit(() => params.tag);

    return (
        <ErrorBoundary fallback={<><div>Tag not found</div></>}>
            <Show when={unitAccessor()}>
                <UnitPage unit={unitAccessor()!} />
            </Show>
        </ErrorBoundary>
    );
}
