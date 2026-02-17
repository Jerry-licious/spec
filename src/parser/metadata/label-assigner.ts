import {DocumentVisitor} from "../visitor";
import {Node, Macro} from "@unified-latex/unified-latex-types";
import {getArgumentText, getContext} from "../util";
import {ParserLogger} from "../logging-base";

export abstract class LabelAssigner extends DocumentVisitor {
    witnessedLabels: Set<string>;
    constructor({witnessedLabels, logger}: { witnessedLabels?: Set<string>, logger?: ParserLogger }) {
        super({ logger });

        this.witnessedLabels = witnessedLabels ?? new Set<string>();
    }

    parseLabel(label: Macro): string | undefined {
        if (!label.args || label.args.length < 3 || !label.args[2]) {
            this.addWarning({
                context: getContext(label),
                message: 'Invalid label.'
            });
            return;
        }

        // The content of the label is determined to be at location 2.
        const labelContent = getArgumentText(label.args[2]);
        if (!labelContent) {
            this.addWarning({
                context: getContext(label),
                message: 'Invalid label.'
            });
            return;
        }

        return labelContent;
    }

    assignLabel(node: Node, label: string | undefined): void {
        if (!label) {
            this.addWarning('Node received no label.');
            return;
        }
        if (this.witnessedLabels.has(label)) {
            this.addWarning(`The label ${label} is already used. As such, this node received no label.`);
            return;
        }

        node.meta = {
            ...node.meta, label
        };

        this.witnessedLabels.add(label);
    }
}

