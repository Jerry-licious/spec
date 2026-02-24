import {createContext, createSignal, JSX, useContext} from "solid-js";


export function createPersistentToggle(key: string, initialValue: boolean) {
    const storedValue = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    const [getter, setter] = createSignal<boolean>(storedValue !== null ? JSON.parse(storedValue) : initialValue);

    return [
        getter,
        (value: boolean) => {
            localStorage.setItem(key, JSON.stringify(value));
            setter(() => value);
        }
    ] as const;
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

