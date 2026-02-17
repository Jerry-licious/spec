import {DocumentVisitor} from "../visitor";
import {ParserLogger} from "../logging-base";
import {Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {printRaw} from "@unified-latex/unified-latex-util-print-raw";


export class CustomMacroCollector extends DocumentVisitor {
    // For now, the custom macros will just be their raw commands, which will be parsed by MathJax on browser.
    // This may change in the future.
    readonly rawMacros: Map<string, string>;

    constructor({ logger }: {  logger?: ParserLogger }) {
        super({ logger });

        this.rawMacros = new Map<string, string>();
    }

    visit(node: Node): void {
        if (!match.macro(node, 'newcommand') && !match.macro(node, 'renewcommand')) return;
        if (!node.args || node.args.length < 3) {
            this.addError('Missing arguments to declare a new macro.');
            return;
        }

        const macroName = node.args[2].content.map((n) => printRaw(n)).join('');
        if (!macroName) {
            this.addError('Missing macro name.');
            return;
        }

        if (this.rawMacros.has(macroName)) {
            if (node.content === 'newcommand') {
                this.addError(`Macro ${macroName} has already been defined.`);
                return;
            } else {
                this.addWarning(`Overwriting the existing definition for ${macroName}.`);
            }
        }

        this.rawMacros.set(macroName, printRaw(node));
    }
}

