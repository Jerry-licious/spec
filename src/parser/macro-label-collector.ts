import {DocumentVisitor} from "./visitor";
import {Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {getArgumentText, getContext} from "./util";



// Assigns labels to macros. The "label recipients" are macros that can have labels assigned to them.
// Macros will only collect labels from their siblings, and will stop collecting upon encountering an environment.
// This behaviour is definitely different compared to actual Tex.
// In particular, the following:
// \chapter{A Rude Awakening}
// \input{rude_awakening}
// will not give the \chapter a label, even if the inputted file has a label on top.
export class MacroLabelCollector extends DocumentVisitor {
    readonly labelRecipients: string[];
    readonly witnessedLabels: Set<string>;

    constructor(labelRecipients: string[] | undefined = []) {
        super();

        if (labelRecipients) {
            this.labelRecipients = labelRecipients;
        } else {
            this.labelRecipients = [];
        }

        this.witnessedLabels = new Set<string>();
    }

    visit(node: Node, visitInfo: VisitInfo): void {
        // The first check here is redundant, but it makes the type system happy.
        if (!match.anyMacro(node) || !this.labelRecipients.some((m) => match.macro(node, m))) return;
        if (typeof visitInfo.index !== 'number' || !visitInfo.containingArray) {
            this.addWarning('Element has no siblings, and cannot receive a label.');
            return;
        }

        let label: string | undefined = undefined;
        for (const sibling of visitInfo.containingArray.slice(visitInfo.index + 1)) {
            // If another label recipient is a sibling, stop searching for labels.
            if (this.labelRecipients.some((m) => match.macro(sibling, m))) break;
            // If an environment is encountered, stop searching for any labels.
            if (match.anyEnvironment(sibling)) break;
            if (!match.macro(sibling, 'label')) continue;

            if (!sibling.args || sibling.args.length < 3 || !sibling.args[2]) {
                this.addWarning({
                    context: getContext(sibling),
                    message: 'Invalid label.'
                });
                break;
            }

            // The content of the label is determined to be at location 2.
            const labelContent = getArgumentText(sibling.args[2]);
            if (!labelContent) {
                this.addWarning({
                    context: getContext(sibling),
                    message: 'Invalid label.'
                });
            }

            label = labelContent;
            break;
        }

        if (!label) {
            this.addWarning('Element received no label.');
            return;
        }

        if (this.witnessedLabels.has(label)) {
            this.addWarning(`The label ${label} is already used. As such, this element received no label.`);
            return;
        }

        node.meta = {
            ...node.meta, label
        }
        this.witnessedLabels.add(label);
    }
}


