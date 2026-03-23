import {onCleanup, onMount} from "solid-js";

export function InvalidateListener() {
    onMount(() => {
        const source = new EventSource("/invalidate/listen");

        console.log("Added listener");

        source.addEventListener("reload", () => {
            console.log("Reload fired!")
            location.reload()
        });
        onCleanup(() => source.close());
    });

    return null;
}

