import {getConfig} from "~/app-data";
import {searchUnits} from "~/app-data-cache";
import {createAsync, useParams} from "@solidjs/router";
import {ErrorBoundary, Show} from "solid-js";
import {Page} from "~/components/Page";
import {UnitLinkList} from "~/components/UnitLinkList";

export const route = {
    preload: ({ params }: {  params: { query: string } }) => {
        getConfig();
        searchUnits(decodeURIComponent(params.query));
    },
};


export default function SearchUnitsView() {
    const params = useParams<{query: string}>();
    const config = createAsync(() => getConfig());
    const searchResult = createAsync(() => searchUnits(decodeURIComponent(params.query)));

    return (
        <ErrorBoundary fallback={<><div>No search results.</div></>}>
            <Show when={searchResult() && config()}>
                <Page titleText={`Search: ${decodeURIComponent(params.query)} | ${config()?.siteTitle}`}
                                              title={`Search: ${decodeURIComponent(params.query)}`}
                                              displayTitle={true}>
                    {
                        searchResult()!.length ? <UnitLinkList items={searchResult()!}/> : 'No results found.'
                    }
            </Page>
            </Show>
        </ErrorBoundary>
    );
}
