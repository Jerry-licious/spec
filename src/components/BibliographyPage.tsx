import {Page} from "~/components/Page";
import {createAsync} from "@solidjs/router";
import {getConfig} from "~/app-data";
import './BibliographyPage.css'
import {BibliographyData} from "~/db/bib-data";

interface BibliographyPageProps {
    bibliography: BibliographyData;
}

interface BibliographyDataRowProps {
    rowName: string
    rowContent: string
}


export function BibliographyDataRow(props: BibliographyDataRowProps) {
    return <tr>
        <td><strong>{props.rowName}</strong></td>
        <td>{props.rowContent}</td>
    </tr>
}


export function BibliographyPage(props: BibliographyPageProps) {
    const config = createAsync(() => getConfig());

    return <Page titleText={`${props.bibliography.title} | ${config()?.siteTitle}`}
                 title={props.bibliography.title}
                 displayTitle={true}>
        <table class={'bibliography-table'}>
            <tbody>
            <BibliographyDataRow rowName={'Author'} rowContent={props.bibliography.author}/>
            <BibliographyDataRow rowName={'Publisher'} rowContent={props.bibliography.publisher}/>
            <BibliographyDataRow rowName={'Year'} rowContent={props.bibliography.year}/>
            <BibliographyDataRow rowName={'Type'} rowContent={props.bibliography.type}/>
            {Object.entries(props.bibliography.aux).map(([k, v]) =>
                <BibliographyDataRow rowName={k} rowContent={v}/>
            )}
            </tbody>
        </table>
        <code class={'bibtex-code'}>
            {props.bibliography.bibtex}
        </code>
    </Page>
}