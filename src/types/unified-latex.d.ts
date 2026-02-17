import "@unified-latex/unified-latex-types"
import {Environment, Node} from "@unified-latex/unified-latex-types"


export interface ElementMetadata {
    sourceFile?: string;
}
export interface LabeledElementMetadata extends ElementMetadata {
    label?: string;
    tag?: number;
    numbering?: number[];
}
export interface TheoremMetadata extends LabeledElementMetadata {
    title?: Node[]; // Theorems/lemmas may come with a title.
    proofs?: Environment[];
}
export interface RefMetadata {
    // Since the ref metadata is created in one step, the fields here will not be optional.
    targetTag: number;
    text: string; // I find it to be a bit annoying to support tex for the ref argument, so I won't.
}


// I'm not sure why they don't export the base node type, but this will have to do for now.
declare module '@unified-latex/unified-latex-types/libs/ast-types' {
    interface ContentNode {
        meta?: ElementMetadata;
    }
    interface Macro {
        meta?: LabeledElementMetadata;
        refMeta?: RefMetadata;
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
        meta?: TheoremMetadata;
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