import './Page.css'
import {ParentChainDisplay} from "./ParentChainDisplay";
import {JSX} from "solid-js";
import {Title} from "@solidjs/meta";
import {Sidebar} from "~/components/Sidebar";
import {createAsync} from "@solidjs/router";
import {getConfig} from "~/app-data";
import {LinkTarget} from "~/db/link-target";


export interface PageProps {
    titleText: string;
    displayTitle: boolean;
    title?: JSX.Element | JSX.Element[] | string;
    children: JSX.Element | JSX.Element[] | string;

    parentChain?: LinkTarget[];

    sidebarContent?: JSX.Element | JSX.Element[] | string;
}


export function Page(props: PageProps) {
    const config = createAsync(() => getConfig());

    return <div class={`page-container ${config()?.website.font}`}>
        <Title>{props.titleText}</Title>
        <ParentChainDisplay parentChain={props.parentChain ?? []} />
        <main class={'page-body'}>
            <article class={'page-content-container'}>
                {
                    props.displayTitle ? <h1 class={'page-title'}>
                        {props.title}
                    </h1> : null
                }
                <div class={'page-content'}>
                    {props.children}
                </div>
            </article>
            <Sidebar>
                {props.sidebarContent}
            </Sidebar>
        </main>
    </div>
}