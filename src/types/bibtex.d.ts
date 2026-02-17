declare module '@orcid/bibtex-parse-js' {
    export interface BibtexEntry {
        citationKey: string;
        entryType: string;
        entryTags: Record<string, string>;

        // Used to generate links.
        tag?: number;
        label?: string;
    }

    export function toJSON(bibtex: string): BibtexEntry[];

    export default { toJSON };
}