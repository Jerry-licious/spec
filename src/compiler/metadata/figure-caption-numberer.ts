import {DocumentVisitor} from "../visitor";
import {Node} from "@unified-latex/unified-latex-types";
import {SKIP, visit, VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";


// Propagate the numbering of figures down to their captions.
export class FigureCaptionNumberer extends DocumentVisitor {
    visit(node: Node, visitInfo: VisitInfo): void | typeof SKIP {
        if (!match.environment(node, 'figure')) return;

        visit(node, (child) => {
            if (!match.macro(child, 'caption')) return;

            child.meta = {
                ...child.meta, numbering: node.meta?.numbering, tag: node.meta?.tag
            };

            node.meta = {
                ...node.meta,
                title: child.args ? child.args.flatMap((a) => a.content) : []
            };
        });

        return SKIP;
    }

}