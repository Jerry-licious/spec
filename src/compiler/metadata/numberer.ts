// Assigns numbers to each numberable node.
import {CountManager} from "../counter";
import {DocumentVisitor} from "../visitor";
import {Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {ParserLogger} from "../logging-base";
import {documentDividers} from "../../unit-types";
import {getEnvName, multiRowMathEnvironments, splitMathRows} from "../util";
import consola from "consola";

export class Numberer extends DocumentVisitor {
    // Association between commands and their corresponding counters.
    macroCounters: Map<string, string>;
    environmentCounters: Map<string, string>;
    countManager: CountManager;

    constructor({ macroCounters, environmentCounters, countManager, logger }: {
        macroCounters?: Map<string, string>;
        environmentCounters?: Map<string, string>;
        countManager: CountManager;
        logger?: ParserLogger
    }) {
        super({ logger });

        this.countManager = countManager;

        if (macroCounters && ![...macroCounters.keys()].every((k) => countManager.hasCounter(k))) {
            throw new Error('Not all referenced macro counters exist in the manager.')
        }

        if (environmentCounters && ![...environmentCounters.values()].every((k) => countManager.hasCounter(k))) {
            throw new Error('Not all referenced environment counters exist in the manager.')
        }

        this.macroCounters = macroCounters ?? new Map<string, string>(
            documentDividers.map((x) => [x, x])
        );
        this.environmentCounters = environmentCounters ?? new Map<string, string>();
    }

    visit(node: Node, visitInfo: VisitInfo): void {
        if (match.anyMacro(node) && this.macroCounters.has(node.content)) {
            node.meta = {
                ...node.meta,
                numbering: this.countManager.increment(this.macroCounters.get(node.content)!!)
            };
        }
        const envName = match.anyEnvironment(node) ? getEnvName(node.env) : undefined;
        if (envName && this.environmentCounters.has(envName)) {
            const counter = this.environmentCounters.get(envName)!!;

            // Multi-row environments: increment once per row and store per-row numberings.
            // Rows with \nonumber or custom \tag{} do not increment the counter.
            if (multiRowMathEnvironments.has(envName)) {
                const rows = splitMathRows((node as any).content);
                const existingRows = (node.meta as any)?.equationRows as { label?: string; numbering?: number[]; customTag?: string; nonumber?: boolean }[] | undefined;
                let firstNumbering: number[] | undefined;
                const equationRows = rows.map((_, i) => {
                    const existing = existingRows && existingRows[i] ? existingRows[i] : {};
                    if (existing.nonumber || existing.customTag) {
                        return { ...existing };
                    }
                    const numbering = this.countManager.increment(counter);
                    if (!firstNumbering) firstNumbering = numbering;
                    return { ...existing, numbering };
                });
                node.meta = {
                    ...node.meta,
                    numbering: firstNumbering,
                    equationRows,
                };
            } else {
                // Custom \tag{} — don't increment the counter.
                if ((node.meta as any)?.customTag) {
                    // No numbering assigned; the custom tag is used instead.
                } else {
                    node.meta = {
                        ...node.meta,
                        numbering: this.countManager.increment(counter)
                    }
                }
            }
        }
    }
}


