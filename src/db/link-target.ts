export interface LinkInfo {
    tag: number;
    numberingText: string;
    unitType: string; // i.e. "thm"
    unitName: string; // i.e. "Theorem"
}

export interface LinkTarget extends LinkInfo{
    // HTML title, if it exists.
    titleHtml?: string;

    // Children, if they exist.
    children?: LinkTarget[];
}


export function linkHTML(target: LinkTarget) {
    const prefix = `${target.unitName} ${target.numberingText}`;

    return target.titleHtml ? `${prefix}: ${target.titleHtml}` : prefix;
}
