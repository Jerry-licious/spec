import {IRUnit} from "./unit";
import {Node} from "@unified-latex/unified-latex-types";
import {printRaw} from "@unified-latex/unified-latex-util-print-raw";
import {ReferenceCollector} from "../metadata";

// To reuse rendering code, the "mainContent" of a block will not be its content, but will just be the original node itself.
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

        const referenceCollector = new ReferenceCollector();
        this.proofs.forEach((n) => referenceCollector.process(n));
        referenceCollector.referencedTags.forEach((t) => this.directReferences.add(t));
    }

    hashData(): Record<string, string> {
        return {
            ...super.hashData(),
            proofs: this.proofs.map((p) => printRaw(p)).join('\n')
        };
    }
}

