import {Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {LabelAssigner} from "./label-assigner";


// Equations are not considered to be environments, so they require an additional layer.
// I will bravely assume that no part of an equation can receive a label.
export class EquationLabelAssigner extends LabelAssigner {
    visit(node: Node, visitInfo: VisitInfo) {
        if (!(match.math(node) && node.type === "displaymath")) return;

        let label: string | undefined;
        for (const child of node.content) {
            if (!match.macro(child, 'label')) continue;

            label = this.parseLabel(child);
        }

        this.assignLabel(node, label);
    }
}