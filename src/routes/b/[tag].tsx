import {createAsync, useParams} from "@solidjs/router";
import {getConfig} from "~/app-data";
import {ErrorBoundary, Show} from "solid-js";
import {getBibliography} from "~/app-data-cache";
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
