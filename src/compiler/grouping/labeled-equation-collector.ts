import {DocumentVisitor} from "../visitor";
import {Environment, Node} from "@unified-latex/unified-latex-types";
import {visit, VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {BlockEnv} from "./block";
import {Division} from "./division";
import {ParserLogger} from "../logging-base";
import {isLabelableDisplayMath} from "../metadata/util";
import {IRUnit} from "./unit";
import {LabeledEquation} from "./labeled-equation";


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
            this.addError('Missing metadata for equation.');
            return;
        }

        this.equations.set(node.meta.tag, new LabeledEquation({
            environment: node,
            label: node.meta.label, numbering: node.meta.numbering, parent: node.meta.parentIRUnit,
            tag: node.meta.tag
        }));
    }
}

