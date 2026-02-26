import {createContext, createSignal, JSX, useContext} from "solid-js";
import {cookieStorage, makePersisted} from "@solid-primitives/storage";


export function createPersistentToggle(key: string, initialValue: boolean) {
    return makePersisted(createSignal<boolean>(initialValue), {
        name: key,
        storage: cookieStorage,
    });
}

const DarkThemeContext = createContext<ReturnType<typeof createPersistentToggle>>();


export function DarkThemeProvider(props: { children: JSX.Element }) {
    const signal = createPersistentToggle('dark-mode', false);
    return <DarkThemeContext.Provider value={signal}>
        {props.children}
    </DarkThemeContext.Provider>
}

export function useDarkTheme() {
    return useContext(DarkThemeContext)!;
}

