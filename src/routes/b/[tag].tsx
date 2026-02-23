import {createAsync, redirect, useNavigate, useParams} from "@solidjs/router";
import {getConfig, getUnits} from "~/app-data";
import {createEffect, ErrorBoundary, onMount, Show} from "solid-js";
import {createGetUnit, getBibliography} from "~/app-data-cache";
import {BibliographyPage} from "~/components/BibliographyPage";



export const route = {
    preload: ({ params }: {  params: { tag: string } }) => {
        getConfig();
        getBibliography(params.tag);
    },
};


export default function BibliographyView() {
    const params = useParams<{tag: string}>();
    const bibAccessor = createAsync(() => getBibliography(params.tag));


    return (
        <ErrorBoundary fallback={<><div>Tag not found</div></>}>
            <Show when={bibAccessor()}>
                <BibliographyPage bibliography={bibAccessor()!} />
            </Show>
        </ErrorBoundary>
    );
}
