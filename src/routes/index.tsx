import {getConfig} from "../app-data";
import {createAsync} from "@solidjs/router";
import {UnitPage} from "../components/UnitPage";
import {ErrorBoundary, Show} from "solid-js";
import {getPreamble, getRecentChanges, getUnit} from "../app-data-cache";
import {Page} from "../components/Page";
import {UnitLinkList} from "../components/UnitLinkList";


export const route = {
    preload: () => {
        getConfig();
        getUnit(0);
        getPreamble();
        getRecentChanges();
    },
};

export default function Home() {
    const mainPageAccessor = createAsync(() => getUnit(0));
    const preamble = createAsync(() => getPreamble());
    const config = createAsync(() => getConfig());
    const recentChanges = createAsync(() => getRecentChanges());

    const errorDescription = "The main page has not been initialised, which suggests that the website has not been compiled yet.";

    return (
        <ErrorBoundary fallback={
            <Page titleText={`${config()?.siteTitle}`} description={errorDescription}
                  title={`${config()?.siteTitle}`} displayTitle={true}>
                {errorDescription}
            </Page>
        }>
            <Show when={mainPageAccessor()}>
                <UnitPage unit={mainPageAccessor()!} additionalSidebarContent={<Show when={recentChanges()}>
                    {
                        recentChanges()?.length ? <UnitLinkList title={'Recent Changes'} items={recentChanges() ?? []}/> : null
                    }
                </Show>} />
                <script type={'text/plain'} id={'preamble'}>{preamble()}</script>
            </Show>
        </ErrorBoundary>
    );
}
