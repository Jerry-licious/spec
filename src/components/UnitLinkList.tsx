import {LinkList, LinkListItem} from "../components/LinkList";
import {linkHTML, LinkTarget} from "../db/link-target";
import {toTagString} from "../tag";

export interface UnitLinkListProps {
    title?: string,
    depth?: number,
    // To determine whether to collapse the list at this point.
    unfoldDepth?: number,
    // To determine whether to use short form html.
    shortDepth?: number,
    items: LinkTarget[],
}


function toLinkListItem(target: LinkTarget, depth: number, collapseDepth: number, shortDepth: number): LinkListItem {
    return {
        content: linkHTML(target, !target.prefersLong && shortDepth <= 0),
        defaultCollapsed: collapseDepth <= 0,
        href: `/t/${toTagString(target.tag)}`,
        children: depth > 0 && target.children && target.children.length > 0 ?
            target.children.map((c) =>
                toLinkListItem(c, depth - 1, collapseDepth - 1, shortDepth - 1)) : []
    };
}


export function UnitLinkList(props: UnitLinkListProps) {
    return <LinkList title={props.title} items={props.items.map((t) =>
        toLinkListItem(t, props.depth ?? 0, (props.unfoldDepth ?? 0) - 1, props.shortDepth ?? 0))}/>
}

