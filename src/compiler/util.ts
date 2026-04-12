import {Argument, DisplayMath, Environment, Macro, Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {NodeContext} from "./error";
import {printRaw} from "@unified-latex/unified-latex-util-print-raw";
import {EXIT, visit} from "@unified-latex/unified-latex-util-visit";


export type RenderToHtml = (node: Node) => Promise<string>;
export type RenderPlugin = (root: Node) => void;
export type RendererBuilder = (plugins: RenderPlugin[]) => RenderToHtml;

// Root folder where all the graphics will be deposited.
export const graphicsRoot = "./public/g/";
export const graphicsURLRoot = '/public/g/';

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

export function argumentIsNonEmpty(node: Argument): boolean {
    let nonEmptyFound: boolean = false;
    visit(node, (c: Node | Argument) => {
        if (match.anyMacro(c) || c.type === 'string') {
            nonEmptyFound = true;
            return EXIT;
        }
    })

    return nonEmptyFound;
}

export function getArgumentTexts(macro: Macro): string[] {
    return macro.args ? macro.args.map(getArgumentText) : [];
}

export function capitaliseFirstLetter(text: string): string {
    return text.length === 0 ? text : text.charAt(0).toUpperCase() + text.slice(1);
}


export type TaggableNode = Macro | Environment | DisplayMath;

export function isLabelableDisplayMath(node: Node): node is Environment {
    return match.anyEnvironment(node) && node.type === 'mathenv';
}

export const reservedLabelStart = "auto:";

// The type annotations here lie.
export function getEnvironmentName(node: Environment) {
    if (typeof node.env === 'string') return node.env;

    // @ts-ignore
    return node.env.map((n) => n.type === 'string' ? n.content : '').join('');
}
