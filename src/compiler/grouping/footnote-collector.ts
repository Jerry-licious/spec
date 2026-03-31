import {DocumentVisitor} from "../visitor";
import {Node} from "@unified-latex/unified-latex-types";
import {SKIP, VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";

export class FootnoteCollector extends DocumentVisitor {
    footnotes: Map<number, Node[]> = new Map();

    constructor(existingFootnotes?: Map<number, Node[]>) {
        super({});

        this.footnotes = existingFootnotes ?? new Map();
    }

    visit(node: Node, visitInfo: VisitInfo): void | typeof SKIP {
        if (!match.macro(node, 'footnote')) return;
        if (!node.meta?.numbering?.length) return;
        if (!node.args) return;

        this.footnotes.set(node.meta.numbering[0], node.args?.flatMap((a) => a.content));
    }
}