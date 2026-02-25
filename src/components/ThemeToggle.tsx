import {useDarkTheme} from "~/theme";
import './ThemeToggle.css'

export default function ThemeToggle() {
    const [darkTheme, setDarkTheme] = useDarkTheme();

    return <button
        onClick={() => setDarkTheme(!darkTheme())}
        class={`theme-toggle-track ${darkTheme() ? 'selected-dark' : 'selected-light'}`}
    >
        <span class={'theme-toggle-light'}>
            L
        </span>
        <span class={'theme-toggle-dark'}>
            D
        </span>
        <span class={`theme-toggle-thumb ${darkTheme() ? 'selected-dark' : 'selected-light'}`}/>
    </button>
}