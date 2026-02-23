import {LinkList} from "~/components/LinkList";
import {linkHTML, LinkTarget} from "~/db/link-target";
import {toTagString} from "~/tag";

export interface UnitLinkListProps {
    title?: string,
    items: LinkTarget[],
}

export function UnitLinkList(props: UnitLinkListProps) {
    return <LinkList title={props.title} items={props.items.map((t) => ({
        innerHTML: linkHTML(t),
        href: `/t/${toTagString(t.tag)}`
    }))}/>
}

