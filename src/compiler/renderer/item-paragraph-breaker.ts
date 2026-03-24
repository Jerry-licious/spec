import {DocumentVisitor} from "../visitor";
import {Node} from "@unified-latex/unified-latex-types";
import {SKIP, VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {wrapPars} from "@unified-latex/unified-latex-to-hast";

// Content of \item s should still be broken in paragraphs.
// In the future, I will have a unified \item rendering system, but as of now I prefer patching unified js a little.
export class ItemParagraphBreaker extends DocumentVisitor {
    visit(node: Node, visitInfo: VisitInfo): void | typeof SKIP {
        if (!match.macro(node, 'item')) return;
        if (!node.args) return;

        // The fourth argument is the content.
        node.args[3].content = wrapPars(node.args[3].content);
    }
}