import {createAsync, useNavigate, useParams} from "@solidjs/router";
import {UnitPage} from "../../components/UnitPage";
import {getConfig} from "../../app-data";
import {ErrorBoundary, onMount, Show} from "solid-js";
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
    const navigate = useNavigate();
    const params = useParams<{tag: string}>();
    const preamble = createAsync(() => getPreamble());
    const unitAccessor = createAsync(() => getUnit(params.tag));
    const config = createAsync(() => getConfig());

    const notFoundMessage = `The page "${params.tag}" does not exist.`;

    return (
        <ErrorBoundary fallback={
            () => {
                onMount(() => {
                    if (sessionStorage.getItem("invalidate_reload")) {
                        sessionStorage.removeItem("invalidate_reload");
                        navigate("/", { replace: true });
                    }
                });

                return <Page titleText={`Page Not Found | ${config()?.siteTitle}`} description={notFoundMessage}
                             title={`Page "${params.tag}" Not Found.`} displayTitle={true}>
                    {notFoundMessage}
                </Page>
            }
        }>
            <Show when={unitAccessor()}>
                <UnitPage unit={unitAccessor()!} />
                <script type={'text/plain'} id={'preamble'}>{preamble()}</script>
            </Show>
        </ErrorBoundary>
    );
}
