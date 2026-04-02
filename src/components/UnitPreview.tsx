import "./UnitPreview.css"
import {createAsync} from "@solidjs/router";
import {getUnit} from "../app-data-cache";
import {createEffect, ErrorBoundary, onMount, Show} from "solid-js";
import {Page} from "./Page";
import {UnitLinkList} from "./UnitLinkList";
import {FootnoteSection} from "./FootnoteSection";

export interface UnitPreviewProps {
    tag: string;
    x: number;
    y: number;

    setOverPreview: (over: boolean) => void;
}

export function UnitPreview(props: UnitPreviewProps) {
    const unit = createAsync(() => getUnit(props.tag));

    createEffect(() => {
        (window as any).MathJax?.startup?.promise
            ?.then(() => (window as any).MathJax.typesetPromise());
    })

    return <div class={'unit-preview'} style={{
        left: `${(props.x ?? 0) + 10}px`,
        top: `${(props.y ?? 0) + 10}px`,
    }} onmouseenter={() => props.setOverPreview(true)} onmouseleave={() => props.setOverPreview(false)} >
        <ErrorBoundary fallback={
            () => {
                return <span>{`The page "${props.tag}" does not exist.`}</span>;
            }
        }>
            <Show when={unit()}>
                {
                    unit()!.contentHTML.trim() ?
                        <div class={'unit-content-container'} innerHTML={unit()!.contentHTML}/> : null
                }
                <FootnoteSection footnotes={unit()!.footnotes ?? null}/>
            </Show>
        </ErrorBoundary>
    </div>
}

