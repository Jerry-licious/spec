import './SearchBar.css'
import {useNavigate} from "@solidjs/router";

export function SearchBar() {
    const navigate = useNavigate();

    return <input type={'search'} placeholder={'Search...'} onkeydown={(e) => {
        if (e.key === 'Enter') {
            // TODO: Implement the search function.
            navigate('/404');
        }
    }} />
}

