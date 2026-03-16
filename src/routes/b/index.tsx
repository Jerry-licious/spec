import {getConfig} from "../../app-data";
import {getAllBibliography} from "../../app-data-cache";
import {createAsync} from "@solidjs/router";
import {Page} from "../../components/Page";
import {toTagString} from "../../tag";
import {ErrorBoundary, Show} from "solid-js";


export const route = {
    preload: () => {
        getConfig();
        getAllBibliography();
    },
};

export default function AllBibliographyView() {
    const config = createAsync(() => getConfig());
    const bibliography = createAsync(() => getAllBibliography());

    const failMessage = "Failed to load bibliography. Please try again later. ";

    return<ErrorBoundary fallback={
        <Page titleText={`Bibliography Failed to Load | ${config()?.siteTitle}`} description={failMessage}
              title={'Bibliography'} displayTitle={true}>
            {failMessage}
        </Page>
    }>
        <Show when={bibliography()}>
            <Page titleText={`Bibliography | ${config()?.siteTitle}`}
                  title={'Bibliography'}
                  displayTitle={true}>
                <div class={'link-list-container'}>
                    <ul class={'link-list'}>
                        {bibliography()!.map(item => <li class={'link-list-item'}>
                            <span>{item.author}, </span>
                            <a href={`b/${toTagString(item.tag)}`} class={'link-primary'}>{item.title}</a>.
                        </li>)}
                    </ul>
                </div>
            </Page>
        </Show>
    </ErrorBoundary>
}
