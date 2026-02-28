import {Element} from "hast";
import {DocumentVisitor} from "../visitor";
import {Node} from "@unified-latex/unified-latex-types";
import {SKIP, VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {s} from "@unified-latex/unified-latex-builder";


// The system provided by LaTeX to Hast is pretty good, so I prefer to not get in the way of it.
// However, the ordered lists provided by the compiler use the 1., 2., 3., format instead of the
// (1), (2), (3), ..., format.
// As such, my method is to simply inject these custom numberings as a parameter during processing.
export class ItemNumberer extends DocumentVisitor {


    visit(node: Node, visitInfo: VisitInfo): void | typeof SKIP {
        if (!match.environment(node, 'enumerate')) return;

        let counter = 0;
        for (const child of node.content) {
            if (!match.macro(child, 'item')) continue;
            counter++;

            // The custom number appears to be in position 1, of all things.
            if (!child.args || !child.args[1]) continue;
            // Do not overwrite existing custom numbering.
            if (child.args[1].content.length !== 0) continue;

            child.args[1].content = [s(`(${counter})`)];
        }
    }
}