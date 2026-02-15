import {DocumentVisitor} from "./visitor";
import {Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {getArgumentText, getContext} from "./util";


// Assigns labels to environments. Will go through the environment's direct children to seek for any labels.
// Has a black and whitelist to adjust what environments should receive labels.
// Uses the macro label recipient to avoid conflicts with labels from macros.
export class EnvironmentLabelAssigner extends DocumentVisitor{
    readonly witnessedLabels: Set<string>;
    readonly blackList: Set<string>;
    readonly whiteList: Set<string>;
    readonly macroLabelRecipients: Set<string>;

    constructor({witnessedLabels, blackList, whiteList, macroLabelRecipients}: {
        witnessedLabels?: Set<string>;
        blackList?: Set<string>;
        whiteList?: Set<string>;
        macroLabelRecipients?: Set<string>;
    }) {
        super();

        this.witnessedLabels = witnessedLabels ?? new Set<string>();
        this.blackList = blackList ?? new Set<string>();
        this.whiteList = whiteList ?? new Set<string>();
        this.macroLabelRecipients = macroLabelRecipients ?? new Set<string>();
    }

    shouldLabel(key: string): boolean {
        // First filter by blacklist, then by whitelist.
        if (this.blackList.has(key)) return false;
        if (this.whiteList.has(key)) return true;

        // If whitelist is empty, allow everything through.
        return this.whiteList.size === 0;
    }

    visit(node: Node, visitInfo: VisitInfo): void {
        if (!match.anyEnvironment(node)) return;
        if (!this.shouldLabel(node.env)) return;

        let label: string | undefined;
        for (const child of node.content) {
            // If an environment is encountered, stop.
            if (match.anyEnvironment(child)) break;
            // Only match macros.
            if (!match.anyMacro(child)) continue;
            // If the macro is a label recipient, skip.
            if (this.macroLabelRecipients.has(child.content)) break;
            if (!match.macro(child, 'label')) continue;

            if (!child.args || child.args.length < 3 || !child.args[2]) {
                this.addWarning({
                    context: getContext(child),
                    message: 'Invalid label.'
                });
                break;
            }

            // The content of the label is determined to be at location 2.
            const labelContent = getArgumentText(child.args[2]);
            if (!labelContent) {
                this.addWarning({
                    context: getContext(child),
                    message: 'Invalid label.'
                });
            }

            label = labelContent;
            break;
        }

        if (!label) {
            this.addWarning('Environment received no label.');
            return;
        }
        if (this.witnessedLabels.has(label)) {
            this.addWarning(`The label ${label} is already used. As such, this environment received no label.`);
            return;
        }

        node.meta = {
            ...node.meta, label
        };

        this.witnessedLabels.add(label);
    }
}

