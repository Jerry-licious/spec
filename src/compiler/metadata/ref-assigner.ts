import {DocumentVisitor} from "../visitor";
import {Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {capitaliseFirstLetter, getArgumentText, TaggableNode} from "../util";
import {ParserLogger} from "../logging-base";
import {LinkInfo} from "../../db/link-target";


// Injects necessary metadata for ref, autoref, and hyperref.
export const refCommands = new Set<string>(['ref', 'autoref', 'hyperref']);


export class RefAssigner extends DocumentVisitor {
    unitLabelLink: Map<string, LinkInfo>;

    constructor({ unitLabelLink, logger }: {
        unitLabelLink: Map<string, LinkInfo>;
        logger?: ParserLogger
    }) {
        super({ logger });

        this.unitLabelLink = unitLabelLink;
    }

    visit(node: Node, visitInfo: VisitInfo): void {
        if (!match.anyMacro(node)) return;
        if (!refCommands.has(node.content)) return;

        if (!node.args) {
            this.addError('Missing arguments for reference command.');
            node.refMeta = {
                targetTag: -1,
                text: 'Unknown',
            };
            return;
        }

        // With surprising luck, the label actually appears in position 1 for all three commands.
        const referenceLabel: string = getArgumentText(node.args[1]);
        if (!this.unitLabelLink.has(referenceLabel)) {
            this.addError(`Label ${referenceLabel} does not exist.`);
            node.refMeta = {
                targetTag: -1,
                text: `Unknown (${referenceLabel})`,
            };
            return;
        }

        const target = this.unitLabelLink.get(referenceLabel)!;


        if (node.content === 'ref') {
            node.refMeta = {
                targetTag: target.tag,
                text: target.numberingText,
            };
            return;
        }

        if (node.content === 'autoref') {
            // In the case of autoref, the name of the node is required to generate the text of the ref.
            node.refMeta = {
                targetTag: target.tag,
                text: `${target.unitName} ${target.numberingText}`.trim()
            };
            return;
        }

        // Finally, in the case of hyperref, simply use the first argument as content of the link.
        // Note that while hyperref does not require looking up the target node to function, I believe that catching an
        // ill-defined reference is still beneficial.
        node.refMeta = {
            targetTag: target.tag, text: node.args[0].content
        };
    }
}


