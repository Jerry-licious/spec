import {DocumentVisitor} from "../visitor";
import {Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {getArgumentText} from "../util";


export class TheoremTitleAssigner extends DocumentVisitor {
    theorems: Set<string>;

    constructor({theorems}: {theorems?: Set<string>}) {
        super();

        this.theorems = theorems ?? new Set<string>();
    }

    visit(node: Node, visitInfo: VisitInfo) {
        if (!(match.anyEnvironment(node) && this.theorems.has(node.env))) return;
        if (!node.args) return;
        if (!node.args[0]) return;

        const title = getArgumentText(node.args[0]);
        if (!title) return;

        node.meta = {
            ...node.meta,
            title: node.args[0].content
        };
    }
}


