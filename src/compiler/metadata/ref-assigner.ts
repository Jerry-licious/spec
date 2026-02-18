import {DocumentVisitor} from "../visitor";
import {Environment, Macro, Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {capitaliseFirstLetter, getArgumentText} from "../util";
import {ParserLogger} from "../logging-base";


// Injects necessary metadata for ref, autoref, and hyperref.
const refCommands = new Set<string>(['ref', 'autoref', 'hyperref']);


export class RefAssigner extends DocumentVisitor {
    tagNodeMap: Map<number, Macro | Environment>;
    labelTagMap: Map<string, number>;
    macroNames: Map<string, string>;
    environmentNames: Map<string, string>;

    constructor({ tagNodeMap, labelTagMap, macroNames, environmentNames, logger }: {
        tagNodeMap?: Map<number, Macro | Environment>;
        labelTagMap?: Map<string, number>;
        macroNames?: Map<string, string>;
        environmentNames?: Map<string, string>;
        logger?: ParserLogger
    }) {
        super({ logger });

        this.tagNodeMap = tagNodeMap ?? new Map<number, Macro | Environment>();
        this.labelTagMap = labelTagMap ?? new Map<string, number>();
        this.macroNames = macroNames ?? new Map<string, string>();
        this.environmentNames = environmentNames ?? new Map<string, string>();
    }


    getNodeName(node: Macro | Environment): string {
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
        if (!this.labelTagMap.has(referenceLabel)) {
            this.addError(`Label ${referenceLabel} does not exist.`);
            node.refMeta = {
                targetTag: -1,
                text: `Unknown (${referenceLabel})`,
            };
            return;
        }

        const targetTag = this.labelTagMap.get(referenceLabel)!!;
        if (!this.tagNodeMap.has(targetTag)) {
            this.addError(`Tag ${targetTag} does not exist.`);
            node.refMeta = {
                targetTag: -1,
                text: `Unknown (${referenceLabel})`,
            };
            return;
        }

        const targetNode = this.tagNodeMap.get(targetTag)!!;
        if (!targetNode.meta) {
            this.addError(`Node ${referenceLabel} is missing metadata, and cannot be referenced.`);
            node.refMeta = {
                targetTag: -1,
                text: `Unknown (${referenceLabel})`,
            };
            return;
        }

        if (node.content === 'ref') {
            node.refMeta = {
                targetTag,
                text: targetNode.meta.numbering ? targetNode.meta.numbering.join('.') : '',
            };
            return;
        }

        if (node.content === 'autoref') {
            // In the case of autoref, the name of the node is required to generate the text of the ref.
            node.refMeta = {
                targetTag,
                text: `${this.getNodeName(targetNode)} ${targetNode.meta.numbering ? targetNode.meta.numbering.join('.') : ''}`
            };
            return;
        }

        // Finally, in the case of hyperref, simply use the first argument as content of the link.
        // Note that while hyperref does not require looking up the target node to function, I believe that catching an
        // ill-defined reference is still beneficial.
        node.refMeta = {
            targetTag, text: getArgumentText(node.args[0])
        };
    }
}


