import './SearchBar.css'
import {useNavigate} from "@solidjs/router";
import {createSignal} from "solid-js";

export function SearchBar() {
    const navigate = useNavigate();
    const [query, setQuery] = createSignal('');

    return <input value={query()} type={'search'} onInput={(e) => setQuery(e.target.value)}
                  placeholder={'Search...'} onkeydown={(e) => {
        if (e.key === 'Enter') {
            const stripped = query().trim();
            if (stripped) {
                navigate(`/s/${encodeURIComponent(stripped)}`);
            }
        }
    }} />
}

