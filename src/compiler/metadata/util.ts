import {DisplayMath, Environment, Macro} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {Node} from "@unified-latex/unified-latex-types";

export type TaggableNode = Macro | Environment | DisplayMath;

export function isLabelableDisplayMath(node: Node) {
    return match.anyEnvironment(node) && node.type === "mathenv";
}

