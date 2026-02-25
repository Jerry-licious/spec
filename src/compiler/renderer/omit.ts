import {NodeRenderer} from "./renderer";
import {Argument, Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {ParserLogger} from "../logging-base";
import consola from "consola";
import {replaceNode} from "@unified-latex/unified-latex-util-replace";
import {getContext} from "~/compiler/util";


// The omitter simply removes certain macros from render.
export class OmitMacro extends NodeRenderer {
    toOmit: Set<string>;

    constructor({toOmit}: {
        toOmit: Set<string>
    }) {
        super({});

        this.toOmit = toOmit;
    }

    render(node: Node): Node | void | null {
        if (match.anyMacro(node) && this.toOmit.has(node.content)) {
            return null;
        }
    }
}
