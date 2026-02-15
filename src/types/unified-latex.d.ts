import "@unified-latex/unified-latex-types"


export interface ElementMetadata {
    sourceFile?: string;
    numbering?: number[]
}
export interface LabeledElementMetadata extends ElementMetadata {
    label?: string;
    tag?: number;
}


// I'm not sure why they don't export the base node type, but this will have to do for now.
declare module '@unified-latex/unified-latex-types/libs/ast-types' {
    interface ContentNode {
        meta?: ElementMetadata;
    }
    interface Macro {
        meta?: LabeledElementMetadata;
    }
    interface Root {
        meta?: ElementMetadata;
    }
    interface String {
        meta?: ElementMetadata;
    }
    interface Whitespace {
        meta?: ElementMetadata;
    }
    interface Parbreak {
        meta?: ElementMetadata;
    }
    interface Environment {
        meta?: LabeledElementMetadata;
    }
    interface Comment {
        meta?: ElementMetadata;
    }
    interface VerbatimEnvironment {
        meta?: ElementMetadata;
    }
    interface InlineMath {
        meta?: ElementMetadata;
    }
    interface DisplayMath {
        meta?: ElementMetadata;
    }
    interface Group {
        meta?: ElementMetadata;
    }
    interface Verb {
        meta?: ElementMetadata;
    }
}