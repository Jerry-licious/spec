import {Argument, Node} from "@unified-latex/unified-latex-types";
import {Location} from "./error";

export function getLocation(node: Node): Location | undefined {
    if (node.meta && node.meta.sourceFile && node.position) {
        return {
            filePath: node.meta.sourceFile,
            line: node.position.start.line,
            column: node.position.start.column
        }
    }
    return undefined;
}

export function getArgumentText(node: Argument): string {
    return node.content.map((n) => n.type === 'string' ? n.content : '').join('');
}
