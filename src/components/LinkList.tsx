import './LinkList.css'
import {JSX} from "solid-js";

export interface LinkListItem {
    content: string | JSX.Element;
    href: string;
    children?: LinkListItem[];
}


export interface LinkListProps {
    title?: string,
    items: LinkListItem[],
}

export function LinkList(props: LinkListProps) {
    return <div class={'link-list-container'}>
        { props.title? <h3>{props.title}</h3> : null }
        <LinkListUl items={props.items}/>
    </div>
}

function LinkListUl(props: { items: LinkListItem[] }) {
    return <ul class={'link-list'}>
        {props.items.map(item => <li class={'link-list-item'}>
            {
                typeof item.content === 'string' ? <a href={item.href} class={'link-primary'} innerHTML={item.content}/> :
                    <a href={item.href} class={'link-primary'}>{item.content}</a>
            }
            {item.children && item.children.length > 0 ? <LinkListUl items={item.children}/> : null}
        </li>)}
    </ul>
}


