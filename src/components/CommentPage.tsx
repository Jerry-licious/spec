import {Page} from "./Page";
import {createAsync} from "@solidjs/router";
import {getConfig} from "../app-data";
import './BibliographyPage.css'
import {BibliographyData} from "../db/bib-data";
import {createMemo, JSX} from "solid-js";
import {CommentData} from "../db/comment";
import {CommentBlock} from "./CommentBlock";
import {isLocalhostQuery} from "../comment";
import {toLinkTarget} from "../db/unit-data";


interface CommentPageProps {
    // Assumes that the unit field is populated.
    comment: CommentData;
}

export function CommentPage(props: CommentPageProps) {
    const config = createAsync(() => getConfig());
    const local = createAsync(() => isLocalhostQuery());
    const linkTarget = createMemo(() => toLinkTarget(props.comment.unit));
    const parentChain = createMemo(() => [
        ...props.comment.unit.parentChain, linkTarget()
    ]);

    return <Page titleText={`Comment #${props.comment.id} | ${config()?.siteTitle}`}
                 description={props.comment.raw.slice(0, 50)}
                 parentChain={parentChain()} displayTitle={false}>
        <CommentBlock comment={props.comment} allowDelete={!!local()}/>
    </Page>
}