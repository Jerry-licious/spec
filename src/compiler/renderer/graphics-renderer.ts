import {NodeRenderer} from "./renderer";
import {Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {htmlLike} from "@unified-latex/unified-latex-util-html-like";
import path from "node:path";
import {graphicsRoot, graphicsURLRoot} from "../util";


// The omitter simply removes certain macros from render.
export class GraphicsRenderer extends NodeRenderer {
    render(node: Node): Node | void | null {
        if (!match.macro(node, "includegraphics")) return node;
        if (!node.meta?.targetFile) return node;

        return htmlLike({
            tag: 'div',
            content: htmlLike({
                tag: 'img',
                attributes: {
                    src: path.join(graphicsURLRoot, node.meta.targetFile),
                }
            })
        });
    }
}
