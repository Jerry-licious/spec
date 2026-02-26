import './Topbar.css'
import {createAsync} from "@solidjs/router";
import {getConfig} from "~/app-data";
import ThemeToggle from "~/components/ThemeToggle";
import {SearchBar} from "~/components/SearchBar";

// The top bar is the side bar but for thin viewports.
export function Topbar() {
    const config = createAsync(() => getConfig());

    return <div class={'page-topbar'}>
        <div class={'page-topbar-row'}>
            <h2><a class={'link-foreground'} href={'/'}>{config()?.siteTitle}</a></h2>
            <div class={'fill'}/>
            <ThemeToggle/>
        </div>
        <div class={'page-topbar-row'}>
            <a href={'/b'} class={'link-primary'}>Bibliography</a>
            <div class={'fill'}/>
            <SearchBar/>
        </div>
    </div>
}