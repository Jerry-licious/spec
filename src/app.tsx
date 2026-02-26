import {MetaProvider} from "@solidjs/meta";
import {Router} from "@solidjs/router";
import {FileRoutes} from "@solidjs/start/router";
import {Suspense} from "solid-js";

import "@fontsource/roboto";
import "@fontsource/open-sans";

import "./app.css";
import "./colours.css";
import {DarkThemeProvider} from "~/theme";

export default function App() {
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
