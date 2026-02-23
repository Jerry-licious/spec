import './LinkList.css'

export interface LinkListItem {
    innerHTML: string;
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
                <a href={item.href} innerHTML={item.innerHTML}/>
            </li>)}
        </ul>
    </div>
}


