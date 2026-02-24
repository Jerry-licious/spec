import {JSX} from "solid-js";
import './Sidebar.css'
import {createAsync} from "@solidjs/router";
import {getConfig} from "~/app-data";
import {SearchBar} from "~/components/SearchBar";
import ThemeToggle from "~/components/ThemeToggle";

export interface SidebarProps {
    children: JSX.Element | JSX.Element[] | string;
}


export function Sidebar(props: SidebarProps) {
    const config = createAsync(() => getConfig());

    return <div class={'page-sidebar'}>
        <h2><a class={'link-foreground'} href={'/'}>{config()?.siteTitle}</a></h2>
        <ThemeToggle/>
        <SearchBar/>
        {props.children}
    </div>
}