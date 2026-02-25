import './LinkList.css'
import {JSX} from "solid-js";

export interface LinkListItem {
    content: string | JSX.Element;
    href: string;
}


export interface LinkListProps {
    title?: string,
    items: LinkListItem[],
}

export function LinkList(props: LinkListProps) {
    return <div class={'link-list-container'}>
        { props.title? <h3>{props.title}</h3> : null }
        <ul class={'link-list'}>
            {props.items.map(item => <li class={'link-list-item'}>
                {
                    typeof item.content === 'string' ? <a href={item.href} class={'link-primary'} innerHTML={item.content}/> :
                        <a href={item.href} class={'link-primary'}>{item.content}</a>
                }
            </li>)}
        </ul>
    </div>
}


