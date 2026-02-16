import {IRNode} from "./node";
import {Node} from "@unified-latex/unified-latex-types";


export class BlockEnv extends IRNode {
    proofs: Node[];

    constructor(args: {
        parent?: IRNode;
        mainContent: Node[];
        sourceNodeName: string;
        name: string;
        title?: Node[];
        label?: string;
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

