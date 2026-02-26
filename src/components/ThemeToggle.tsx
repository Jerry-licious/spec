import {useDarkTheme} from "~/theme";
import './ThemeToggle.css'

export default function ThemeToggle() {
    const [darkTheme, setDarkTheme] = useDarkTheme();

    return <button
        onClick={() => setDarkTheme(!darkTheme())}
        class={`theme-toggle-track ${darkTheme() ? 'selected-dark' : 'selected-light'}`}
    >
        <span class={'theme-toggle-icon theme-toggle-sun'}>sunny</span>
        <span class={'theme-toggle-icon theme-toggle-moon'}>bedtime</span>
        <span class={`theme-toggle-thumb ${darkTheme() ? 'selected-dark' : 'selected-light'}`}/>
    </button>
}