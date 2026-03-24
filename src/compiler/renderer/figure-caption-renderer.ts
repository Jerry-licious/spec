import {NodeRenderer} from "./renderer";
import {Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {htmlLike} from "@unified-latex/unified-latex-util-html-like";
import {classes} from "./classes";
import {s} from "@unified-latex/unified-latex-builder";

export class FigureCaptionRenderer extends NodeRenderer {
    render(node: Node): Node | void | null {
        if (!match.macro(node, 'caption')) return;

        return htmlLike({
            tag: 'span',
            attributes: {
                class: classes.figureCaption,
            },
            content: [
                s(node.meta?.numbering ? `Figure ${node.meta.numbering.join('.')}: ` : ''),
                ...node.args ? node.args.flatMap((a) => a.content) : []
            ]
        });
    }
}