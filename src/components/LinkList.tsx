import './LinkList.css'
import {createSignal, JSX, Show} from "solid-js";

export interface LinkListItem {
    content: string | JSX.Element;
    href: string;

    children: LinkListItem[];
    defaultCollapsed?: boolean,
}


export interface LinkListProps {
    title?: string,
    items: LinkListItem[],
    defaultCollapsed?: boolean,
    invisible?: boolean,
}

function LinkedListItem(item: LinkListItem) {
    const [collapsed, setCollapsed] = createSignal(item.defaultCollapsed ?? false);

    return (<li class={'link-list-item'}>
        {
            item.children.length ? <button class={'collapse-button'}
                                           onClick={() => setCollapsed((c) => !c)}>{
                collapsed() ? 'keyboard_arrow_right' : 'keyboard_arrow_down'
            }</button> : <span class={'link-list-marker'}>circle</span>
        }
        {
            typeof item.content === 'string' ? <a href={item.href} class={'link-primary'} innerHTML={item.content}/> :
                <a href={item.href} class={'link-primary'}>{item.content}</a>
        }
        <Show when={item.children.length}>
            {
                item.children.length ? <LinkList invisible={collapsed()} items={item.children} defaultCollapsed={item.defaultCollapsed}/> : null
            }
        </Show>
    </li>)
}


export function LinkList(props: LinkListProps) {
    return <div class={`link-list-container ${props.invisible ? 'invisible' : ''}`}>
        { props.title? <h3>{props.title}</h3> : null }
        <ul class={'link-list'}>
            {props.items.map(item => <LinkedListItem {...item}/>)}
        </ul>
    </div>
}


