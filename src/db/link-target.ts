export interface LinkTarget {
    tag: number;
    numberingText: string;
    unitType: string; // i.e. "thm"
    unitName: string; // i.e. "Theorem"

    // HTML title, if it exists.
    titleHtml?: string;
}