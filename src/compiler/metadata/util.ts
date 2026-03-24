import {Argument, DisplayMath, Environment, Macro} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {Node} from "@unified-latex/unified-latex-types";

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
