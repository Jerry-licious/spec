import {Argument, Macro, Node} from "@unified-latex/unified-latex-types";
import {NodeContext} from "./error";
import { printRaw } from "@unified-latex/unified-latex-util-print-raw";


export const documentDividers = ['part', 'chapter', 'section', 'subsection', 'subsubsection'] as const;


export function getContext(node: Node): NodeContext | undefined {
    if (node.meta && node.meta.sourceFile && node.position) {
        return {
            filePath: node.meta.sourceFile,
            line: node.position.start.line,
            column: node.position.start.column,
            content: printRaw(node)
        }
    }
    return undefined;
}

export function getArgumentText(node: Argument): string {
    return node.content.map((n) => n.type === 'string' ? n.content : '').join('');
}

export function getArgumentTexts(macro: Macro): string[] {
    return macro.args ? macro.args.map(getArgumentText) : [];
}

