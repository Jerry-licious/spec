import {IRUnit} from "./unit";
import {Node} from "@unified-latex/unified-latex-types";


export class BlockEnv extends IRUnit {
    proofs: Node[];

    constructor(args: {
        parent?: IRUnit;
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

