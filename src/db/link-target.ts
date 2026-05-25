export interface LinkInfo {
    tag: number;
    numberingText: string;
    unitType: string; // i.e. "thm"
    unitName: string; // i.e. "Theorem"
}

export interface LinkTarget extends LinkInfo {
    // HTML title, if it exists.
    titleHtml?: string;
    // Whether the unit prefers to display itself as "Name x.x.x" even when required to only display its number.
    prefersLong: boolean;

    // Children, if they exist.
    children?: LinkTarget[];
}


export function linkHTML(target: LinkTarget, short?: boolean) {
    const prefix = short ? target.numberingText : `${target.unitName} ${target.numberingText}`;

    return target.titleHtml ? `${prefix}: ${target.titleHtml}` : prefix;
}

