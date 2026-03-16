import {createAsync, useParams} from "@solidjs/router";
import {getConfig} from "../../app-data";
import {ErrorBoundary, Show} from "solid-js";
import {getBibliography} from "../../app-data-cache";
import {BibliographyPage} from "../../components/BibliographyPage";
import {Page} from "../../components/Page";


export const route = {
    preload: ({ params }: {  params: { tag: string } }) => {
        getConfig();
        getBibliography(params.tag);
    },
};


export default function BibliographyView() {
    const params = useParams<{tag: string}>();
    const bibAccessor = createAsync(() => getBibliography(params.tag));
    const config = createAsync(() => getConfig());

    const notFoundMessage = `The bibliography entry "${params.tag}" does not exist.`;

    return (
        <ErrorBoundary fallback={
            <Page titleText={`Bibliography Not Found | ${config()?.siteTitle}`}
                  description={notFoundMessage}
                  title={`Bibliography "${params.tag}" Not Found.`} displayTitle={true}>
                {notFoundMessage}
            </Page>
        }>
            <Show when={bibAccessor()}>
                <BibliographyPage bibliography={bibAccessor()!} />
            </Show>
        </ErrorBoundary>
    );
}
