import {createAsync, useParams} from "@solidjs/router";
import {UnitPage} from "~/components/UnitPage";
import {getConfig} from "~/app-data";
import {ErrorBoundary, Show} from "solid-js";
import {createGetUnit, getPreamble, getUnit} from "~/app-data-cache";


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

    return (
        <ErrorBoundary fallback={<><div>Tag not found</div></>}>
            <Show when={unitAccessor()}>
                <UnitPage unit={unitAccessor()!} />
                <script type={'text/plain'} id={'preamble'}>{preamble()}</script>
            </Show>
        </ErrorBoundary>
    );
}
