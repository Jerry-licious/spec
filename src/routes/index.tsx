import {getConfig} from "../app-data";
import {createAsync} from "@solidjs/router";
import {UnitPage} from "~/components/UnitPage";
import {ErrorBoundary, Show} from "solid-js";
import {createGetUnit} from "~/app-data-cache";


export const route = {
    preload: () => {
        getConfig();
        createGetUnit(() => 0);
    },
};

export default function Home() {
    const [mainPageAccessor] = createGetUnit(() => 0);
    const config = createAsync(() => getConfig());

    return (
        <ErrorBoundary fallback={<><div>Tag not found</div></>}>
            <Show when={mainPageAccessor()}>
                <UnitPage unit={mainPageAccessor()!} />
            </Show>
        </ErrorBoundary>
    );
}
