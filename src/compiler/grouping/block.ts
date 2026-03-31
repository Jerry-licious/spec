import {IRUnit} from "./unit";
import {Node} from "@unified-latex/unified-latex-types";
import {printRaw} from "@unified-latex/unified-latex-util-print-raw";
import {ReferenceCollector} from "../metadata";
import {FootnoteCollector} from "./footnote-collector";
import {RendererBuilder} from "../util";

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
            sourceNodeType: "environment",
            parasitic: false,
            isDivision: false,
        });

        this.proofs = args.proofs;

        const referenceCollector = new ReferenceCollector();

        for (const n of this.proofs) referenceCollector.process(n);
        for (const t of referenceCollector.referencedTags) this.directReferences.add(t);

        const collector = new FootnoteCollector(this.footnotes);
        for (const t of this.proofs) collector.process(t);
        this.footnotes = collector.footnotes;
    }

    hashData(): Record<string, string> {
        return {
            ...super.hashData(),
            proofs: this.proofs.map((p) => printRaw(p)).join('\n')
        };
    }

    renderBody(renderer: RendererBuilder): string {
        return renderer([])({
            type: 'root',
            content: [
                ...this.mainContent,
                ...this.proofs
            ],
        })
    }
}

