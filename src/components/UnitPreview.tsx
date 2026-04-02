import "./UnitPreview.css"
import {createAsync} from "@solidjs/router";
import {getUnit} from "../app-data-cache";
import {createEffect, createSignal, ErrorBoundary, on, onMount, Show} from "solid-js";
import {FootnoteSection} from "./FootnoteSection";

export interface UnitPreviewProps {
    tag: string;
    x: number;
    y: number;

    setOverPreview: (over: boolean) => void;
}

export function UnitPreview(props: UnitPreviewProps) {
    const [unit, setUnit] = createSignal<Awaited<ReturnType<typeof getUnit>> | undefined>();

    createEffect(on(() => props.tag, async (tag) => {
        if (!tag) return;
        const data = await getUnit(tag);
        setUnit(() => data);
        queueMicrotask(() => {
            (window as any).MathJax?.startup?.promise
                ?.then(() => (window as any).MathJax.typesetPromise([previewRef]));
        });
    }));

    let previewRef!: HTMLDivElement;

    return <div class={'unit-preview'} ref={previewRef} style={{
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

