import {getConfig} from "../app-data";
import {createAsync} from "@solidjs/router";
import {UnitPage} from "../components/UnitPage";
import {ErrorBoundary, Show} from "solid-js";
import {createGetUnit, getPreamble, getUnit} from "../app-data-cache";
import {Page} from "../components/Page";


export const route = {
    preload: () => {
        getConfig();
        getUnit(0);
        getPreamble();
    },
};

export default function Home() {
    const mainPageAccessor = createAsync(() => getUnit(0));
    const preamble = createAsync(() => getPreamble());
    const config = createAsync(() => getConfig());

    return (
        <ErrorBoundary fallback={
            <Page titleText={`${config()?.siteTitle}`}
                  title={`${config()?.siteTitle}`} displayTitle={true}>
                The main page has not been initialised, which suggests that the website has not been compiled yet.
            </Page>
        }>
            <Show when={mainPageAccessor()}>
                <UnitPage unit={mainPageAccessor()!} />
                <script type={'text/plain'} id={'preamble'}>{preamble()}</script>
            </Show>
        </ErrorBoundary>
    );
}
