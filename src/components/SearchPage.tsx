import {createAsync, useParams} from "@solidjs/router";
import {getConfig} from "~/app-data";
import {SearchResult, searchUnits} from "~/app-data-cache";
import {createMemo, ErrorBoundary, JSX, Show} from "solid-js";
import {Page} from "~/components/Page";
import {UnitLinkList} from "~/components/UnitLinkList";
import './SearchPage.css'


export interface SearchPageProps {
    query: string;
    page: number;
}

function searchResultsText(result: SearchResult, currentPage: number): string | null {
    if (result.totalResults === 0) return null;

    const resultCount = `Found ${result.totalResults} results.`;

    if (result.totalPages > 1) {
        return `${resultCount} Showing page ${currentPage + 1} of ${result.totalPages}.`;
    }
    return resultCount;
}


interface SearchPageSelectorProps {
    currentPage: number;
    totalPages: number;
    query: string;
}

interface SearchPageSelectionProps {
    page: number;
    query: string;
    selected: boolean;
}

function SearchPageSelection(props: SearchPageSelectionProps) {
    if (props.selected) {
        return <strong class={'search-page-selected'}>{props.page + 1}</strong>
    }

    return <a href={`/s/${encodeURIComponent(props.query)}/${props.page}`} class={'link-primary'}>{props.page + 1}</a>
}


function SearchPageSelector(props: SearchPageSelectorProps) {
    const searchPageSelections = createMemo(() => {
        const indicesToRender = new Set<number>(
            [0, 1, props.totalPages - 1, props.currentPage,
                Math.min(props.currentPage + 1, props.totalPages - 1),
                Math.max(props.currentPage - 1, 0)]
        );

        const result: JSX.Element[] = [];
        const indicesSorted = [...indicesToRender].sort((a, b) => a - b);

        for (let i = 0; i < indicesSorted.length; i++) {
            const indexToRender = indicesSorted[i];
            result.push(
                <SearchPageSelection page={indexToRender} query={props.query}
                                     selected={props.currentPage === indexToRender}/>
            );
            if (i < indicesSorted.length - 1 && indicesSorted[i + 1] - indicesSorted[i] > 1) {
                result.push(<span class={'search-page-ellipses'}>...</span>);
            }
        }

        return result;
    });

    return <div class={'search-page-selector'}>
        {searchPageSelections()}
    </div>
}


export function SearchPage(props: SearchPageProps) {
    const config = createAsync(() => getConfig());
    const searchResult = createAsync(() => searchUnits(props.query, props.page));

    return (
        <ErrorBoundary fallback={
            <Page titleText={`Search Failed | ${config()?.siteTitle}`} title={`Search: ${props.query}`} displayTitle={true}>
                Failed to search for "{props.query}". Please try again later.
            </Page>
        }>
            <Show when={searchResult() && config()}>
                <Page titleText={`Search: ${props.query} | ${config()?.siteTitle}`}
                      title={`Search: ${props.query}`}
                      displayTitle={true}>
                    {
                        searchResult()!.totalResults ? searchResultsText(searchResult()!, props.page) : null
                    }
                    {
                        searchResult()!.totalResults ? <UnitLinkList items={searchResult()!.results}/> : 'No results found.'
                    }
                    <div style={'flex: 1'}/>
                    {
                        searchResult()!.totalPages > 1 ?
                            <SearchPageSelector currentPage={props.page} query={props.query}
                                                totalPages={searchResult()!.totalPages}/> : null
                    }
                </Page>
            </Show>
        </ErrorBoundary>
    );
}


