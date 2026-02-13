import "@unified-latex/unified-latex-types"


export interface ElementMetadata {
    sourceFile?: string;
    numbering?: number[]
}

declare module '@unified-latex/unified-latex-types/libs/ast-types' {
    interface Macro {
        meta?: ElementMetadata;
    }
    interface Environment {
        meta?: ElementMetadata;
    }
}