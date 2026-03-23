import "@unified-latex/unified-latex-types"
import {Environment, Node} from "@unified-latex/unified-latex-types"


export interface ElementMetadata {
    sourceFile?: string;
}
export interface LabeledElementMetadata extends ElementMetadata {
    label?: string;
    tag?: number;
    numbering?: number[];
    customTag?: string;   // user-specified \tag{...} overrides auto-numbering
}
// Per-row data for multi-row math environments (align, gather, etc.).
export interface EquationRowData {
    label?: string;
    numbering?: number[];
    customTag?: string;   // user-specified \tag{...} overrides auto-numbering
    nonumber?: boolean;   // \nonumber suppresses numbering for this row
}

export interface TheoremMetadata extends LabeledElementMetadata {
    title?: Node[]; // Theorems/lemmas may come with a title.
    proofs?: Environment[];
    // For multi-row math environments like align, stores per-row labels and numberings.
    equationRows?: EquationRowData[];
    // Additional labels beyond meta.label that map to this node's tag.
    additionalLabels?: string[];
}
export interface RefMetadata {
    // Since the ref metadata is created in one step, the fields here will not be optional.
    targetTag: number;
    text: Node[] | string;
    // For targets that are not standalone units (e.g. equations inside a section),
    // parentTag points to the containing unit's page and anchor is the fragment ID.
    parentTag?: number;
    anchor?: string;
}


// I'm not sure why they don't export the base node type, but this will have to do for now.
declare module '@unified-latex/unified-latex-types/' {
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