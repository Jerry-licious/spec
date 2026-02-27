import {Page} from "~/components/Page";
import {createAsync} from "@solidjs/router";
import {getConfig} from "~/app-data";
import {mainPageType, shouldDisplayTitle} from "~/unit-types";
import './UnitPage.css'
import {UnitLinkList} from "~/components/UnitLinkList";
import {createEffect, createMemo, onMount} from "solid-js";
import {UnitData} from "~/db/unit-data";


export interface UnitPageProps {
    unit: UnitData
}

function UnitSidebarContent(props: UnitPageProps) {
    return <div class={'unit-sidebar-content'}>
        {props.unit.directlyReferences.length ? <UnitLinkList title={'Direct References'} items={props.unit.directlyReferences}/> : ''}
        {props.unit.indirectlyReferences.length ? <UnitLinkList title={'Indirect References'} items={props.unit.indirectlyReferences}/> : ''}
        {props.unit.directlyReferencedBy.length ? <UnitLinkList title={'Direct Backlinks'} items={props.unit.directlyReferencedBy}/> : ''}
        {props.unit.indirectlyReferencedBy.length ? <UnitLinkList title={'Indirect Backlinks'} items={props.unit.indirectlyReferencedBy}/> : ''}
    </div>
}

export function UnitPage(props: UnitPageProps) {
    const config = createAsync(() => getConfig());

    const titleText = createMemo(() => {
        let titleText = props.unit.unitName;
        if (props.unit.numberingText) {
            titleText = titleText + ' ' + props.unit.numberingText;
        }
        if (props.unit.titleText) {
            titleText = titleText + ': ' + props.unit.titleText;
        }

        // No need to display the main title twice.
        if (props.unit.unitType !== mainPageType) {
            titleText = `${titleText} | ${config()?.siteTitle}`;
        } else {
            titleText = config()?.siteTitle ?? 'Unknown Site Title';
        }

        return titleText;
    });

    let containerRef: HTMLDivElement | undefined;
    createEffect(() => {
        const _ = props.unit.tag;
        const mathJax = (window as any).MathJax;
        if (!mathJax) return;
        (mathJax.startup?.promise ?? Promise.resolve()).then(() => {
            mathJax.typesetClear();

            const preambleElement: HTMLScriptElement | null = document.querySelector('#preamble');
            if (preambleElement) {
                mathJax.tex2mml(preambleElement.innerText);
            }

            mathJax.typesetPromise();
        })
    });

    return <Page titleText={titleText()}
                 displayTitle={shouldDisplayTitle(props.unit.unitType)}
                 title={<span>
                     {props.unit.numberingText ? `${props.unit.numberingText} ` : null}<span innerHTML={props.unit.titleHTML ?? ''}/>
                 </span>}
                 sidebarContent={<UnitSidebarContent {...props} />}
                 parentChain={props.unit.parentChain}>
        {
            props.unit.contentHTML.trim() ?
                <div class={'unit-content-container'} ref={containerRef} innerHTML={props.unit.contentHTML}/> : null
        }
        {
            props.unit.children && props.unit.children.length > 0 ?
                // Only say "content" if there is a need to separate this portion from the previous.
                <UnitLinkList title={props.unit.contentHTML.trim() ? 'Contents' : ''}
                          items={props.unit.children}/> : null
        }
    </Page>
}

