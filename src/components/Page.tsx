import './Page.css'
import {ParentChainDisplay} from "./ParentChainDisplay";
import {JSX, onMount} from "solid-js";
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

    // Reload
    onMount(() => {
        (window as any).MathJax?.typesetPromise();
    });
    
    return <div class={'main-container'}>
        <Title>{props.titleText}</Title>
        <div class={`page-container ${config()?.website.font}`}>
            {
                props.parentChain && props.parentChain.length ?
                    <ParentChainDisplay parentChain={props.parentChain ?? []}/> : null
            }
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
    </div>
}