import {createAsync, useParams} from "@solidjs/router";
import {UnitPage} from "../../components/UnitPage";
import {getConfig} from "../../app-data";
import {ErrorBoundary, Show} from "solid-js";
import {createGetUnit, getPreamble, getUnit} from "../../app-data-cache";
import {Page} from "../../components/Page";


export const route = {
    preload: ({ params }: {  params: { tag: string } }) => {
        getConfig();
        getPreamble();
        getUnit(params.tag);
    },
};


export default function UnitView() {
    const params = useParams<{tag: string}>();
    const preamble = createAsync(() => getPreamble());
    const unitAccessor = createAsync(() => getUnit(params.tag));
    const config = createAsync(() => getConfig());

    return (
        <ErrorBoundary fallback={
            <Page titleText={`Page Not Found | ${config()?.siteTitle}`}
                  title={`Page "${params.tag}" Not Found.`} displayTitle={true}>
                The page "{params.tag}" does not exist.
            </Page>
        }>
            <Show when={unitAccessor()}>
                <UnitPage unit={unitAccessor()!} />
                <script type={'text/plain'} id={'preamble'}>{preamble()}</script>
            </Show>
        </ErrorBoundary>
    );
}
