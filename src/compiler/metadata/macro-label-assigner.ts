import {Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {LabelAssigner} from "./label-assigner";
import {ParserLogger} from "../logging-base";


// Assigns labels to macros. The "label recipients" are macros that can have labels assigned to them.
// Macros will only collect labels from their siblings, and will stop collecting upon encountering an environment.
// This behaviour is definitely different compared to actual Tex.
// In particular, the following:
// \chapter{A Rude Awakening}
// \input{rude_awakening}
// will not give the \chapter a label, even if the inputted file has a label on top.
export class MacroLabelAssigner extends LabelAssigner {
    readonly labelRecipients: Set<string>;

    constructor({labelRecipients, witnessedLabels, logger}: {
        labelRecipients?: Set<string>;
        witnessedLabels?: Set<string>;
        logger?: ParserLogger
    }) {
        super({witnessedLabels, logger});

        this.labelRecipients = labelRecipients ?? new Set<string>();
    }

    visit(node: Node, visitInfo: VisitInfo): void {
        if (!match.anyMacro(node) || !this.labelRecipients.has(node.content)) return;
        if (typeof visitInfo.index !== 'number' || !visitInfo.containingArray) {
            this.addWarning('Element has no siblings, and cannot receive a label.');
            return;
        }

        let label: string | undefined = undefined;
        for (const sibling of visitInfo.containingArray.slice(visitInfo.index + 1)) {
            // If an environment is encountered, stop searching for any labels.
            if (match.anyEnvironment(sibling)) break;
            // If another label recipient is a sibling, stop searching for labels.
            if (match.anyMacro(sibling) && this.labelRecipients.has(sibling.content)) break;

            if (!match.macro(sibling, 'label')) continue;

            label = this.parseLabel(sibling);
            break;
        }

        this.assignLabel(node, label);
    }
}


