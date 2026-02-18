import {DocumentVisitor} from "../visitor";
import {Environment, Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {ParserLogger} from "../logging-base";


// Assigns proofs to theorems.
// Will only visit siblings of the theorem blocks.
// Has some tolerance in that the collection will only be interrupted by macros, math, and non-proof environments.
export class TheoremProofAssigner extends DocumentVisitor {
    theorems: Set<string>;

    constructor({theorems, logger}: {theorems?: Set<string>, logger?: ParserLogger}) {
        super({ logger });

        this.theorems = theorems ?? new Set<string>();
    }

    visit(node: Node, visitInfo: VisitInfo): void {
        if (!(match.anyEnvironment(node) && this.theorems.has(node.env))) return;
        if (!visitInfo.containingArray || typeof visitInfo.index !== 'number') {
            node.meta = {
                ...node.meta,
                proofs: []
            };
            return;
        }

        const collectedProofs: Environment[] = [];
        for (const sibling of visitInfo.containingArray.slice(visitInfo.index + 1)) {
            // Macros, math, and non-proof environments will interrupt the collection.
            if (match.anyMacro(sibling)) break;
            if (match.math(sibling)) break;
            if (match.anyEnvironment(sibling) && sibling.env !== 'proof') break;

            if (match.anyEnvironment(sibling) && sibling.env === 'proof') {
                collectedProofs.push(sibling)
            }
        }

        node.meta = {
            ...node.meta,
            proofs: collectedProofs
        };
    }
}
