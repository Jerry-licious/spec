import './ParentChainDisplay.css'
import {linkHTML, LinkTarget} from "../db/link-target";
import {toTagString} from "../tag";

export interface ParentTreeDisplayProps {
    parentChain: LinkTarget[];
}

interface ParentChainElementProps {
    element: LinkTarget;
}

function ParentChainElement(props: ParentChainElementProps) {
    return <span class={'parent-display'}>
        <span class={'parent-display-slash'}>/</span>
        <a class={'link-primary'} href={`/t/${toTagString(props.element.tag)}`}>{linkHTML(props.element)}</a>
    </span>
}


export function ParentChainDisplay(props: ParentTreeDisplayProps) {
    return <div class={'parent-chain-display-container'}>
        {props.parentChain.map((p) => <ParentChainElement element={p}/>)}
    </div>
}

