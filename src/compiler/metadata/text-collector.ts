// Produces a set of tags directly referenced by the node.
import {DocumentVisitor} from "../../compiler/visitor";
import {SKIP, VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {Node} from "@unified-latex/unified-latex-types";

export class TextCollector extends DocumentVisitor {
    textParts: string[];
    macrosToOmit: Set<string>;

    constructor({ macrosToOmit }: {macrosToOmit: Set<string>}) {
        super({});

        this.textParts = [];
        this.macrosToOmit = macrosToOmit;
    }

    visit(node: Node, visitInfo: VisitInfo): void | typeof SKIP {
        if (match.macro(node) && this.macrosToOmit.has(node.content)) return SKIP;

        if (match.string(node)) {
            this.textParts.push(node.content);
        }
    }

    getCollectedText(): string {
        return this.textParts.map((p) => p.trim()).filter((p) => p).join(' ');
    }
}
