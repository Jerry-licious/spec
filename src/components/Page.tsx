import './Page.css'
import {ParentChainDisplay} from "./ParentChainDisplay";
import {createEffect, JSX, onMount} from "solid-js";
import {Title} from "@solidjs/meta";
import {Sidebar} from "~/components/Sidebar";
import {createAsync} from "@solidjs/router";
import {getConfig} from "~/app-data";
import {LinkTarget} from "~/db/link-target";
import {useDarkTheme} from "~/theme";
import {Topbar} from "~/components/Topbar";


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
    const [darkTheme] = useDarkTheme();

    const primaryColourClass = config() ? `primary-${config()?.website.primaryColour}` : 'primary-blue';
    const neutralColourClass = config() ? `neutral-${config()?.website.neutralColour}` : 'neutral-grey';

    createEffect(() => {
        props.children; // Access children.
        console.log('Mounted!');
        console.log((window as any).MathJax);
        queueMicrotask(() => {
            (window as any).MathJax?.startup?.promise
                ?.then(() => (window as any).MathJax.typesetPromise());
        });
    });

    return <div class={`main-container ${darkTheme() ? 'dark' : 'light'} ${primaryColourClass} ${neutralColourClass}`}>
        <Title>{props.titleText}</Title>
        <div class={`page-container ${config()?.website.font}`}>
            <Topbar/>
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