import {DocumentVisitor} from "../visitor";
import {SKIP, VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {DisplayMath, Environment, Macro, Node} from "@unified-latex/unified-latex-types";
import {LinkInfo} from "../../db/link-target";
import {capitaliseFirstLetter, TaggableNode} from "../util";
import {match} from "@unified-latex/unified-latex-util-match";
import {ParserLogger} from "../logging-base";


// When compiling things like comments, the rest of the document is detached. As such, both compiling the document or
// loading from the database should arrive at the same starting point: a map of labels to link targets.
// This is the compiler's part of the job.
export class LinkInfoCollector extends DocumentVisitor {
    labelLinkMap: Map<string, LinkInfo> = new Map();
    macroNames: Map<string, string>;
    environmentNames: Map<string, string>;

    constructor({ macroNames, environmentNames, logger }: {
        macroNames?: Map<string, string>;
        environmentNames?: Map<string, string>;
        logger?: ParserLogger
    }) {
        super({ logger });

        this.macroNames = macroNames ?? new Map<string, string>();
        this.environmentNames = environmentNames ?? new Map<string, string>();
    }

    getNodeType(node: TaggableNode): string {
        if (match.math(node)) {
            return node.type;
        }

        if (match.anyMacro(node)) {
            return node.content;
        }

        if (match.anyEnvironment(node)) {
            return node.env;
        }

        return "unknown";
    }

    getNodeName(node: TaggableNode): string {
        if (match.math(node) || (match.anyEnvironment(node) && node.type === 'mathenv')) {
            return "Equation";
        }

        if (match.anyMacro(node)) {
            const macro = node.content;
            if (this.macroNames.has(macro)) {
                return this.macroNames.get(macro)!!;
            }

            this.addWarning(`Missing name for the macro ${macro}. Capitalising its first letter to fill in.`);
            return capitaliseFirstLetter(macro);
        } else {
            const env = node.env;
            if (this.environmentNames.has(env)) {
                return this.environmentNames.get(env)!!;
            }

            this.addWarning(`Missing name for the environment ${env}. Capitalising its first letter to fill in.`);
            return capitaliseFirstLetter(env);
        }
    }

    visit(node: Node, visitInfo: VisitInfo): void | typeof SKIP {
        if (!match.anyMacro(node) && !match.anyEnvironment(node) && !match.math(node)) return;
        if (match.math(node) && node.type === 'inlinemath') return;

        if (!node.meta) return;

        if (node.meta.tag === undefined) return;
        if (!node.meta.label) return;

        this.labelLinkMap.set(node.meta.label, {
            tag: node.meta.tag,
            numberingText: node.meta.numbering ? node.meta.numbering.join('.') : '',
            unitType: this.getNodeType(node),
            unitName: this.getNodeName(node)
        });
    }
}


