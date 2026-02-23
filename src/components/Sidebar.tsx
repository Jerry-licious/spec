import {JSX} from "solid-js";
import './Sidebar.css'

export interface SidebarProps {
    children: JSX.Element | JSX.Element[] | string;
}


export function Sidebar(props: SidebarProps) {
    return <div class={'page-sidebar'}>
        OTHER CONTENT TO BE IMPLEMENTED
        {props.children}
    </div>
}