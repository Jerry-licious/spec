import {MetaProvider} from "@solidjs/meta";
import {Router} from "@solidjs/router";
import {FileRoutes} from "@solidjs/start/router";
import {Suspense, onMount} from "solid-js";
import {isServer} from "solid-js/web";

import "@fontsource/roboto";
import "@fontsource/open-sans";
import "@fontsource/material-icons";
import "@fontsource-variable/chivo-mono";

import "./app.css";
import "./colours.css";
import {DarkThemeProvider} from "./theme";

export default function App() {
    // Connect to the live-reload SSE server (started by `spec watch` on port+1).
    // In production or with `spec serve`, the connection silently fails.
    onMount(() => {
        if (isServer) return;
        try {
            const port = parseInt(window.location.port || '3000') + 1;
            const url = `http://${window.location.hostname}:${port}`;
            let retries = 0;
            const connect = () => {
                const es = new EventSource(url);
                es.onmessage = async () => {
                    try {
                        // Check the current page still exists before reloading.
                        const resp = await fetch(window.location.href, { cache: 'no-store' });
                        if (resp.ok) {
                            window.location.reload();
                        } else {
                            // Tag changed — page no longer exists. Go home.
                            window.location.href = '/';
                        }
                    } catch {
                        window.location.reload();
                    }
                };
                es.onerror = () => {
                    es.close();
                    // Reconnect with backoff, up to 5 attempts.
                    if (retries < 5) {
                        retries++;
                        setTimeout(connect, 1000 * retries);
                    }
                };
                es.onopen = () => { retries = 0; };
            };
            connect();
        } catch {}
    });

    return (
        <Router
            root={props => (
                <MetaProvider>
                    <DarkThemeProvider>
                        <Suspense>{props.children}</Suspense>
                    </DarkThemeProvider>
                </MetaProvider>
            )}

        >
            <FileRoutes/>
        </Router>
    );
}
