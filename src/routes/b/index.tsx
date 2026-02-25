import {getConfig} from "~/app-data";
import {getAllBibliography} from "~/app-data-cache";
import {createAsync} from "@solidjs/router";
import {Page} from "~/components/Page";
import {toTagString} from "~/tag";
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

    return<ErrorBoundary fallback={<><div>Bibliography not found.</div></>}>
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
