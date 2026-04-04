import {DocumentVisitor} from "../visitor";
import {Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {ParserLogger} from "../logging-base";
import {LabeledEquation} from "./labeled-equation";
import {isLabelableDisplayMath} from "../util";


export class LabeledEquationCollector extends DocumentVisitor {
    equations: Map<number, LabeledEquation>; // Map from tags to the created IR nodes.

    constructor({ logger }: {
        logger?: ParserLogger;
    }) {
        super({ logger });

        this.equations = new Map<number, LabeledEquation>();
    }

    visit(node: Node, visitInfo: VisitInfo): void {
        if (!isLabelableDisplayMath(node)) return;

        if (!node.meta || !node.meta.tag || !node.meta.parentIRUnit) {
            return;
        }

        this.equations.set(node.meta.tag, new LabeledEquation({
            environment: node,
            label: node.meta.label, numbering: node.meta.numbering, parent: node.meta.parentIRUnit,
            tag: node.meta.tag
        }));
    }
}

