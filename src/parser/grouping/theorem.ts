import {IRNode} from "./node";
import {Node} from "@unified-latex/unified-latex-types";


export class TheoremEnv extends IRNode {
    proofs: Node[];

    constructor(args: {
        parent?: IRNode;
        mainContent: Node[];
        sourceNodeName: string;
        title: string;
        tag: number;
        numbering: number[];
        proofs: Node[];
    }) {
        super({
            ...args,
            sourceNodeType: "environment"
        });

        this.proofs = args.proofs;
    }
}

