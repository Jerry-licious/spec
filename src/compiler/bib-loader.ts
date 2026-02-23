import {DocumentVisitor} from "./visitor";
import {Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import bibtexParse, {BibtexEntry} from '@orcid/bibtex-parse-js';
import {match} from "@unified-latex/unified-latex-util-match";
import {getArgumentText} from "./util";
import path, {join} from "node:path";
import {readFileSync} from "node:fs";
import {nextSafeTag} from "../tag";
import {ParserLogger} from "./logging-base";
import {AppDataSource} from "../db";
import {BibliographyData} from "~/db/bib-data";


const supportedBibliographyStyles = new Set<string>(['plain', 'alpha', 'raw']);

const essentialEntryTags = new Set<string>(['title', 'booktitle', 'author', 'year', 'publisher']);

export class BibliographyLoader extends DocumentVisitor {
    bibliographyEntries: Map<string, BibtexEntry>;
    bibliographyStyle: string = 'plain';

    // Map of existing tags.
    keyTagMap: Map<string, number>;
    nextAvailableTag: number;

    constructor({ keyTagMap, nextAvailableTag, logger }: {
        keyTagMap: Map<string, number>;
        nextAvailableTag: number;
        logger?: ParserLogger;
    }) {
        super({ logger });

        this.bibliographyEntries = new Map<string, BibtexEntry>();
        this.keyTagMap = keyTagMap;
        this.nextAvailableTag = nextAvailableTag;
    }

    visit(node: Node, visitInfo: VisitInfo): void {
        if (match.macro(node, 'bibliographystyle')) {
            if (!node.args || !node.args[0]) {
                this.addError('Invalid bibliography style.');
                return;
            }
            const argument = getArgumentText(node.args[0]);
            if (!supportedBibliographyStyles.has(argument)) {
                this.addError('The only supported bibliography styles are plain and alpha.');
                return
            }

            this.bibliographyStyle = argument;
        }

        if (!match.macro(node, 'bibliography')) return;
        if (!node.args) {
            this.addError('Missing arguments for the bibliography command.');
            return;
        }
        if (!node.meta || !node.meta.sourceFile) {
            this.addError('Missing metadata for the bibliography command.');
            return;
        }

        const workingDirectory = path.dirname(node.meta.sourceFile);
        const fileName = getArgumentText(node.args!![0]);

        // Separate loading section here because in this case we can attribute any problem to the particular input command.
        let targetFile = join(workingDirectory, fileName);

        if (!targetFile.endsWith('.bib')) {
            targetFile = targetFile + '.bib';
        }

        let fileContent = "";
        try {
            // Aside from my laziness, the bibliography loader is not async so it can identify those that come after as
            // duplicates, rather than from before.
            // In addition, it's unlikely for a document to have more than one bibliography file anyways.
            fileContent = readFileSync(targetFile, { encoding: 'utf8' });
        } catch (e) {
            this.addError(`Failed to read file ${targetFile}.`);
            return;
        }

        try {
            const entries = bibtexParse.toJSON(fileContent);
            let acceptedEntries = 0;

            for (const entry of entries) {
                if (this.bibliographyEntries.has(entry.citationKey)) {
                    this.addError(`Duplicate citation key ${entry.citationKey}.`);
                    continue;
                }
                this.bibliographyEntries.set(entry.citationKey, entry);
                acceptedEntries++;
            }
        } catch (e) {
            this.addError(`Failed to parse bibtex: ${e}.`);
        }
    }

    process(input: Node) {
        super.process(input);
        this.assignMetadata();
    }

    getAuthors(entry: BibtexEntry): string[] {
        if (!('author' in entry.entryTags)) return [];

        return entry.entryTags.author.toString().split(' and ');
    }

    getAuthorLastNames(entry: BibtexEntry): string[] {
        return this.getAuthors(entry).map((author) => {
            author = author.trim();
            // If commas are present, we are in Last name, First name territory.
            if (author.includes(',')) {
                return author.split(',')[0].trim();
            }
            // Otherwise, we are in firstname lastname territory.
            return author.split(/\s+/).pop()!
        });
    }

    compareBibliographyEntries(a: BibtexEntry, b: BibtexEntry) {
        const authorsA = this.getAuthorLastNames(a);
        const authorsB = this.getAuthorLastNames(b);

        // Compare authors one by one.
        const minLength = Math.min(authorsA.length, authorsB.length);
        for (let i = 0; i < minLength; i++) {
            const cmp = authorsA[i].localeCompare(authorsB[i]);
            if (cmp !== 0) return cmp;
        }

        // Otherwise, shorter list comes first.
        if (authorsA.length !== authorsB.length) return authorsA.length - authorsB.length;

        const aHasYear = 'year' in a.entryTags;
        const bHasYear = 'year' in b.entryTags;
        if (aHasYear != bHasYear) {
            return aHasYear ? -1 : 1;
        }

        // The comparison here is verbose on purpose.
        if (aHasYear && bHasYear) {
            const aYear = parseInt(a.entryTags.year) || 0;
            const bYear = parseInt(b.entryTags.year) || 0;

            if (aYear != bYear) return aYear - bYear;
        }

        const aHasTitle = 'title' in a.entryTags;
        const bHasTitle = 'title' in b.entryTags;
        if (aHasTitle != bHasTitle) {
            return aHasTitle ? -1 : 1;
        }

        if (aHasTitle && bHasTitle) {
            return a.entryTags.title.localeCompare(b.entryTags.title);
        }

        return 0;
    }

    assignPlainLabels() {
        const alphabeticalOrder = [...this.bibliographyEntries.values()]
            .sort((a, b) => this.compareBibliographyEntries(a, b));

        alphabeticalOrder.forEach((entry, index) => {
            entry.label = `${index+1}`;
        });
    }

    getAlphaLabel(entry: BibtexEntry): string {
        const authors = this.getAuthorLastNames(entry);

        let authorNames = '';
        switch (authors.length) {
            case 0:
                authorNames = '???';
                break;
            case 1:
                authorNames = authors[0].length ? authors[0].slice(0, 3) : '???';
                break;
            case 2:
            case 3:
                authorNames = authors.map((n) => n.length ? n[0] : '?').join('');
                break;
        }
        if (authors.length > 3) {
            authorNames = authorNames + '+';
        }

        const year = 'year' in entry.entryTags ? entry.entryTags.year.slice(-2) : '';

        return authorNames + year;
    }

    disambiguationSuffix(n: number): string {
        if (n === 0) return '';
        let result = '';
        while (n > 0) {
            n--;
            result = String.fromCharCode(97 + (n % 26)) + result;
            n = Math.floor(n / 26);
        }
        return result;
    }

    assignAlphaLabels() {
        // Use this system to find and manage duplicates.
        const labelMap = new Map<string, BibtexEntry[]>();

        const alphabeticalOrder = [...this.bibliographyEntries.values()]
            .sort((a, b) => this.compareBibliographyEntries(a, b));

        for (const entry of alphabeticalOrder) {
            const label = this.getAlphaLabel(entry);
            if (labelMap.has(label)) {
                labelMap.get(label)?.push(entry);
            } else {
                labelMap.set(label, [entry]);
            }
        }

        // Then assign suffixes accordingly.
        for (const [label, entries] of labelMap.entries()) {
            entries.forEach((entry, index) => {
                entry.label = label + this.disambiguationSuffix(index);
            });
        }
    }

    assignRawLabels() {
        for (const entry of this.bibliographyEntries.values()) {
            entry.label = entry.citationKey;
        }
    }

    // Assigns tags and labels to all bibliography entries.
    assignMetadata() {
        // Acquiring the tags is relatively easy.
        for (const entry of this.bibliographyEntries.values()) {
            if (this.keyTagMap.has(entry.citationKey)) {
                entry.tag = this.keyTagMap.get(entry.citationKey);
            } else {
                entry.tag = this.nextAvailableTag;
                this.keyTagMap.set(entry.citationKey, entry.tag);

                this.nextAvailableTag = nextSafeTag(this.nextAvailableTag + 1);
            }
        }

        switch (this.bibliographyStyle) {
            case 'plain':
                this.assignPlainLabels();
                break;
            case 'alpha':
                this.assignAlphaLabels();
                break;
            case 'raw':
                this.assignRawLabels();
                break;
        }
    }

    toBibliographyData(entry: BibtexEntry): BibliographyData {
        let title = 'Unknown';
        if ('title' in entry.entryTags) {
            title = entry.entryTags.title;
        }
        if ('booktitle' in entry.entryTags) {
            title = entry.entryTags.booktitle;
        }

        const fieldsCode = Object.entries(entry.entryTags)
            .map(([k, v]) => `    ${k}={${v}}`)
            .join('\n')

        return AppDataSource.manager.create(BibliographyData, {
            tag: entry.tag,
            key: entry.citationKey,
            type: entry.entryType,

            author: 'author' in entry.entryTags ? entry.entryTags.author : 'Unknown',
            title,
            year: 'year' in entry.entryTags ? entry.entryTags.year : 'Unknown',
            publisher: 'publisher' in entry.entryTags ? entry.entryTags.publisher : 'Unknown',

            // Remove the entries used above.
            aux: Object.fromEntries(Object.entries(entry.entryTags)
                .filter(([k, v]) => !essentialEntryTags.has(k))),

            bibtex: `@${entry.entryType}{${entry.citationKey},\n${fieldsCode}\n}`
        })
    }

    getBibliographyData() {
        return [...this.bibliographyEntries.values()].map((e) => this.toBibliographyData(e))
    }
}