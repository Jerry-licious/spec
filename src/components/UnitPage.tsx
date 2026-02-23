import {Page} from "~/components/Page";
import {createAsync} from "@solidjs/router";
import {getConfig} from "~/app-data";
import {mainPageType, shouldDisplayTitle} from "~/unit-types";
import './UnitPage.css'
import {LinkList} from "~/components/LinkList";
import {toTagString} from "~/tag";
import {UnitLinkList} from "~/components/UnitLinkList";
import {createEffect, createMemo, createSignal, onMount, Suspense} from "solid-js";
import {clientOnly} from "@solidjs/start";
import Counter from "~/components/Counter";
import {UnitData} from "~/db/unit-data";
import {cacheRelatedUnits} from "~/app-data-cache";


export interface UnitPageProps {
    unit: UnitData
}

function UnitSidebarContent(props: UnitPageProps) {
    return <div>
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

    // Whenever a unit page is loaded, also cache in the adjacent units.
    onMount(() => {
        cacheRelatedUnits(props.unit);
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
                <div class={'unit-content-container'} innerHTML={props.unit.contentHTML}/> : null
        }
        {
            props.unit.children && props.unit.children.length > 0 ?
                // Only say "content" if there is a need to separate this portion from the previous.
                <UnitLinkList title={props.unit.contentHTML.trim() ? 'Contents' : ''}
                          items={props.unit.children}/> : null
        }
    </Page>
}

