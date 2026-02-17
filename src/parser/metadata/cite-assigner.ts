import {DocumentVisitor} from "../visitor";
import {Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {BibtexEntry} from "@orcid/bibtex-parse-js";
import {match} from "@unified-latex/unified-latex-util-match";
import {getArgumentText} from "../util";
import {ParserLogger} from "../logging-base";

export class CiteAssigner extends DocumentVisitor {
    bibliographyEntries: Map<string, BibtexEntry>;

    constructor({bibliographyEntries, logger}: {
        bibliographyEntries: Map<string, BibtexEntry>;
        logger?: ParserLogger;
    }) {
        super({ logger });

        this.bibliographyEntries = bibliographyEntries;
    }

    visit(node: Node, visitInfo: VisitInfo): void {
        if (!match.macro(node, 'cite')) return;
        if (!node.args || node.args.length < 2) {
            this.addError('Cite has insufficient arguments.');
            return;
        }

        const key = getArgumentText(node.args[1]);
        if (!this.bibliographyEntries.has(key)) {
            this.addError(`Citation key ${key} does not exist.`);
            return;
        }

        const targetEntry = this.bibliographyEntries.get(key)!!;

        // For the text of the link, only the label will be supplied. This is because only the label will be
        // hyperlinked in a citation.
        node.refMeta = {
            targetTag: targetEntry.tag!!,
            text: targetEntry.label!!
        };
    }
}