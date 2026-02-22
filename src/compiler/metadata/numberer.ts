// Assigns numbers to each numberable node.
import {CountManager} from "../counter";
import {DocumentVisitor} from "../visitor";
import {Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {ParserLogger} from "../logging-base";
import {documentDividers} from "~/unit-types";

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
        if (environmentCounters && ![...environmentCounters.keys()].every((k) => countManager.hasCounter(k))) {
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
        if (match.anyEnvironment(node) && this.environmentCounters.has(node.env)) {
            node.meta = {
                ...node.meta,
                numbering: this.countManager.increment(this.environmentCounters.get(node.env)!!)
            }
        }
    }
}


