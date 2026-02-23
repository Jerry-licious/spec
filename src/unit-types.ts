export const mainPageType = 'document';
export const mainPageTag = 0;

export const documentDividers = ['part', 'chapter', 'section', 'subsection', 'subsubsection'] as const;
const documentDividersSet = new Set<string>(documentDividers);

export function shouldDisplayTitle(unitType: string) {
    console.log(unitType);
    console.log(documentDividersSet.has(unitType) || unitType === mainPageType);

    return documentDividersSet.has(unitType) || unitType === mainPageType;
}

