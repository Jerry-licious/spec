import {Page} from "./Page";
import {createAsync} from "@solidjs/router";
import {getConfig} from "../app-data";
import './BibliographyPage.css'
import {BibliographyData} from "../db/bib-data";
import {JSX} from "solid-js";

interface BibliographyPageProps {
    bibliography: BibliographyData;
}

interface BibliographyDataRowProps {
    rowName: string
    children: JSX.Element
}


export function BibliographyDataRow(props: BibliographyDataRowProps) {
    return <tr>
        <td><strong>{props.rowName}</strong></td>
        <td>{props.children}</td>
    </tr>
}


export function BibliographyPage(props: BibliographyPageProps) {
    const config = createAsync(() => getConfig());

    return <Page titleText={`${props.bibliography.title} | ${config()?.siteTitle}`}
                 title={props.bibliography.title}
                 displayTitle={true}>
        <table class={'bibliography-table'}>
            <tbody>
            <BibliographyDataRow rowName={'Author'}>{props.bibliography.author}</BibliographyDataRow>
            <BibliographyDataRow rowName={'Publisher'}>{props.bibliography.publisher}</BibliographyDataRow>
            <BibliographyDataRow rowName={'Year'}>{props.bibliography.year}</BibliographyDataRow>
            <BibliographyDataRow rowName={'Type'}>{props.bibliography.type}</BibliographyDataRow>
            {
                props.bibliography.url ? <BibliographyDataRow rowName={'URL'}>
                    <a class={'link-primary'} href={props.bibliography.url}>{props.bibliography.url}</a>
                </BibliographyDataRow> : null
            }
            {Object.entries(props.bibliography.aux).map(([k, v]) =>
                <BibliographyDataRow rowName={k}>{v}</BibliographyDataRow>
            )}
            </tbody>
        </table>
        <code class={'bibtex-code'}>
            {props.bibliography.bibtex}
        </code>
    </Page>
}