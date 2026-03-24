import {NodeRenderer} from "./renderer";
import {Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {htmlLike} from "@unified-latex/unified-latex-util-html-like";
import {classes} from "./classes";

export class FigureRenderer extends NodeRenderer {
    render(node: Node): Node | void | null {
        if (!match.environment(node, 'figure')) return;

        return htmlLike({
            tag: 'div',
            attributes: {
                class: classes.figure,
            },
            content: node.content
        });
    }
}