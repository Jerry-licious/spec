import './LinkList.css'
import {createSignal, JSX, Show} from "solid-js";

export interface LinkListItem {
    content: string | JSX.Element;
    href: string;

    children: LinkListItem[];
}


export interface LinkListProps {
    title?: string,
    items: LinkListItem[],
    defaultCollapsed?: boolean,
}

export function LinkList(props: LinkListProps) {
    const [collapsed, setCollapsed] = createSignal(props.defaultCollapsed ?? false);

    return <div class={'link-list-container'}>
        { props.title? <h3>{props.title}</h3> : null }
        <ul class={'link-list'}>
            {props.items.map(item => <li class={'link-list-item'}>
                {
                    item.children.length ? <button class={'collapse-button'}
                                                   onClick={() => setCollapsed((c) => !c)}>{
                        collapsed() ? 'keyboard_arrow_right' : 'keyboard_arrow_down'
                    }</button> : null
                }
                {
                    typeof item.content === 'string' ? <a href={item.href} class={'link-primary'} innerHTML={item.content}/> :
                        <a href={item.href} class={'link-primary'}>{item.content}</a>
                }
                <Show when={item.children.length && !collapsed()}>
                    {
                        item.children.length ? <LinkList items={item.children}/> : null
                    }
                </Show>
            </li>)}
        </ul>
    </div>
}


