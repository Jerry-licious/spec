import {onCleanup, onMount} from "solid-js";


function isLocalhost(hostname: string) {
    return (
        hostname === "localhost" ||
        hostname === "::1" ||
        /^127(\.\d{1,3}){3}$/.test(hostname) ||
        hostname.endsWith(".localhost")
    );
}

export function InvalidateListener() {
    onMount(() => {
        if (!isLocalhost(window.location.hostname)) return;

        const source = new EventSource("/invalidate/listen");

        source.addEventListener("reload", () => {
            sessionStorage.setItem("invalidate_reload", "1");
            location.reload()
        });
        onCleanup(() => source.close());
    });

    return null;
}

