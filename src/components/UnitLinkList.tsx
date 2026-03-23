import {LinkList} from "../components/LinkList";
import {linkHTML, LinkTarget} from "../db/link-target";
import {toTagString} from "../tag";

export interface UnitLinkListProps {
    title?: string,
    items: LinkTarget[],
}

function linkTargetToItem(t: LinkTarget): { content: string; href: string; children?: { content: string; href: string; children?: any }[] } {
    return {
        content: linkHTML(t),
        href: `/t/${toTagString(t.tag)}`,
        ...(t.children && t.children.length > 0
            ? { children: t.children.map(linkTargetToItem) }
            : {})
    };
}

export function UnitLinkList(props: UnitLinkListProps) {
    return <LinkList title={props.title} items={props.items.map(linkTargetToItem)}/>
}

