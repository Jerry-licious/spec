import {Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {LabelAssigner} from "./label-assigner";
import {getCustomTag, getEnvName, hasNonumber, multiRowMathEnvironments, splitMathRows} from "../util";


// Numbered equation environments that can receive labels.
const numberedEquationEnvironments = new Set<string>(['equation', 'align', 'multline', 'gather', 'flalign']);


// Assigns labels to display math and numbered equation environments.
export class EquationLabelAssigner extends LabelAssigner {
    visit(node: Node, visitInfo: VisitInfo) {
        const isDisplayMath = match.math(node) && node.type === "displaymath";
        const isMathEnv = match.anyEnvironment(node) && node.type === 'mathenv';

        if (!isDisplayMath && !(isMathEnv && numberedEquationEnvironments.has(getEnvName(node.env)))) return;

        const envName = isMathEnv ? getEnvName(node.env) : undefined;

        // Multi-row environments (align): each row can have its own label.
        if (envName && multiRowMathEnvironments.has(envName)) {
            const rows = splitMathRows(node.content);
            const rowData: { label?: string }[] = [];
            let firstLabel: string | undefined;
            const additionalLabels: string[] = [];

            for (const row of rows) {
                let rowLabel: string | undefined;
                for (const child of row) {
                    if (match.macro(child, 'label')) {
                        rowLabel = this.parseLabel(child);
                    }
                }
                const customTag = getCustomTag(row);
                const nonumber = hasNonumber(row);
                rowData.push({
                    label: rowLabel,
                    ...(customTag !== undefined ? { customTag } : {}),
                    ...(nonumber ? { nonumber: true } : {}),
                });

                if (rowLabel) {
                    if (!firstLabel) {
                        firstLabel = rowLabel;
                    } else {
                        additionalLabels.push(rowLabel);
                        // Register additional labels as witnessed so they can't be reused.
                        // The first label is registered by assignLabel() below.
                        this.witnessedLabels.add(rowLabel);
                    }
                }
            }

            node.meta = {
                ...node.meta,
                equationRows: rowData,
                ...(additionalLabels.length > 0 ? { additionalLabels } : {}),
            };

            // Use assignLabel for the primary label (sets meta.label and registers in witnessedLabels).
            this.assignLabel(node, firstLabel);
            return;
        }

        // Single-row environments (equation) and display math.
        let label: string | undefined;
        for (const child of node.content) {
            if (!match.macro(child, 'label')) continue;
            label = this.parseLabel(child);
        }

        // Detect custom \tag{} for single equations.
        const customTag = getCustomTag(node.content);
        if (customTag !== undefined) {
            node.meta = { ...node.meta, customTag };
        }

        this.assignLabel(node, label);
    }
}
