import {NodeRenderer} from "./renderer";
import {Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {ParserLogger} from "../logging-base";


// The omitter simply removes certain macros from render.
export class OmitMacro extends NodeRenderer {
    toOmit: Set<string>;

    constructor({toOmit, logger}: {
        toOmit: Set<string>,
        logger?: ParserLogger
    }) {
        super({ logger });

        this.toOmit = toOmit;
    }

    render(node: Node): Node | void | null {
        if (match.anyMacro(node) && this.toOmit.has(node.content)) {
            return null;
        }
    }
}

