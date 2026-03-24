import {onCleanup, onMount} from "solid-js";

export function InvalidateListener() {
    onMount(() => {
        const source = new EventSource("/invalidate/listen");

        source.addEventListener("reload", () => {
            sessionStorage.setItem("invalidate_reload", "1");
            location.reload()
        });
        onCleanup(() => source.close());
    });

    return null;
}

