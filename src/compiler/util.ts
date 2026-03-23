import {Argument, Macro, Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {NodeContext} from "./error";
import {printRaw} from "@unified-latex/unified-latex-util-print-raw";


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

export function capitaliseFirstLetter(text: string): string {
    return text.length === 0 ? text : text.charAt(0).toUpperCase() + text.slice(1);
}

// Multi-row math environments (align, gather) have rows separated by \\ macros.
// These are the environments where each row gets its own equation number.
export const multiRowMathEnvironments = new Set<string>(['align', 'gather', 'flalign']);

// Split a math environment's flat content array into per-row segments.
// Rows are delimited by \\ macros (line breaks).
export function splitMathRows(content: Node[]): Node[][] {
    const rows: Node[][] = [[]];
    for (const node of content) {
        if (match.anyMacro(node) && /^\\+$/.test(node.content)) {
            rows.push([]);
        } else {
            rows[rows.length - 1].push(node);
        }
    }
    // Remove trailing empty row (common when align ends with \\).
    if (rows.length > 1 && rows[rows.length - 1].every(
        n => n.type === 'whitespace' || (n.type === 'string' && n.content.trim() === '')
    )) {
        rows.pop();
    }
    return rows;
}

// Check if a list of nodes contains \nonumber.
export function hasNonumber(nodes: Node[]): boolean {
    return nodes.some(n => match.macro(n, 'nonumber'));
}

// Extract the text of a \tag{...} macro from a list of nodes, if present.
export function getCustomTag(nodes: Node[]): string | undefined {
    for (const n of nodes) {
        if (match.macro(n, 'tag') && n.args && n.args[1]) {
            return getArgumentText(n.args[1]);
        }
    }
    return undefined;
}

// Normalise the env name of an environment or mathenv node to a plain string.
// Regular environments have env as a string, but mathenv nodes have env as an AST object.
export function getEnvName(env: any): string {
    return typeof env === 'string' ? env : printRaw(env);
}