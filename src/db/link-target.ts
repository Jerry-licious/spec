export interface LinkTarget {
    tag: number;
    numberingText: string;
    unitType: string; // i.e. "thm"
    unitName: string; // i.e. "Theorem"

    // HTML title, if it exists.
    titleHtml?: string;
}


export function linkHTML(target: LinkTarget) {
    const prefix = `${target.unitName} ${target.numberingText}`;

    return target.titleHtml ? `${prefix}: ${target.titleHtml}` : prefix;
}
