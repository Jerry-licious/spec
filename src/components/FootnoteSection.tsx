import "./FootnoteSection.css"


interface FootnoteEntryProps {
    localIndex: number;
    globalIndex: number;
    contentHTML: string;
}

function FootnoteEntry(props: FootnoteEntryProps) {
    return <li class={'footnote-entry'} id={`footnote-${props.globalIndex}`}>
        <span innerHTML={props.contentHTML}/>
        <a href={`#footnote-${props.globalIndex}-ref`} class={'footnote-return'}>keyboard_return</a>
    </li>
}


export interface FootnoteSectionProps {
    footnotes: Record<number, string> | null;
}

export function FootnoteSection(props: FootnoteSectionProps) {
    if (!props.footnotes) return null;
    if (!Object.keys(props.footnotes).length) return null;

    return <ol class={'footnote-section'}>
        {
            Object.entries(props.footnotes)
                .map(([i, h]): [number, string] => [Number(i), h])
                .sort(([a], [b]) => a - b)
                .map(([globalIndex, contentHTML], localIndex) =>
                    <FootnoteEntry localIndex={localIndex} globalIndex={globalIndex} contentHTML={contentHTML}/>
                )
        }
    </ol>
}
