import {DocumentVisitor} from "../visitor";
import {Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {IRUnit} from "./unit";
import {match} from "@unified-latex/unified-latex-util-match";
import {BlockEnv} from "./block";


export class BlockCollector extends DocumentVisitor {
    // Both works as a set that contains all the theorem types to keep track of, and a
    blockNames: Map<string, string>;
    blocks: Map<number, IRUnit>; // Map from tags to the created IR nodes.

    constructor({ blockNames }: { blockNames: Map<string, string> }) {
        super();

        this.blockNames = blockNames;
        this.blocks = new Map<number, IRUnit>();
    }

    visit(node: Node, visitInfo: VisitInfo): void {
        if (!(match.anyEnvironment(node) && this.blockNames.has(node.env))) return;

        if (!node.meta || !node.meta.tag) {
            this.addError('Missing metadata for block.');
            return;
        }

        const blockName = this.blockNames.get(node.env)!!;
        this.blocks.set(node.meta.tag, new BlockEnv({
            name: blockName,
            title: node.meta.title ?? [],
            mainContent: node.content,
            sourceNodeName: node.env,
            label: node.meta.label,
            tag: node.meta.tag,
            numbering: node.meta.numbering ?? [],
            proofs: node.meta.proofs ?? [],
        }));
    }
}

