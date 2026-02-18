import {DocumentVisitor} from "../visitor";
import {Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {refCommands} from "./ref-assigner";


// Produces a set of tags directly referenced by the node.
export class ReferenceCollector extends DocumentVisitor {
    referencedTags: Set<number>;
    constructor() {
        super({}); // The reference collector does not log.

        this.referencedTags = new Set<number>();
    }

    visit(node: Node, visitInfo: VisitInfo): void {
        // For tag references, bibliography will be ignored.
        if (!(match.macro(node) && refCommands.has(node.content) && node.refMeta)) return;
        this.referencedTags.add(node.refMeta.targetTag);
    }

    addTag(tag: number) {
        this.referencedTags.add(tag);
    }
}
