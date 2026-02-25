export const mainPageType = 'document';
export const mainPageTag = 0;

export const documentDividers = ['part', 'chapter', 'section', 'subsection', 'subsubsection'] as const;
const documentDividersSet = new Set<string>(documentDividers);

// Macros to not render.
export const macrosToOmit = new Set([
    'label', 'newcommand', 'renewcommand', 'newtheorem', 'bibliographystyle', 'bibliography'
]);

export function shouldDisplayTitle(unitType: string) {
    return documentDividersSet.has(unitType) || unitType === mainPageType;
}

