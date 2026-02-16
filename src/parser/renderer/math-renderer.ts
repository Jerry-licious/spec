

// For now, I will settle with converting the mathjax environments into barebone text nodes.
// In the future, mathjax may be rendered entirely online.
import {NodeRenderer} from "./renderer";
import {Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {printRaw} from "@unified-latex/unified-latex-util-print-raw";
import {htmlLike} from "@unified-latex/unified-latex-util-html-like";

export class MathRenderer extends NodeRenderer {
    render(node: Node): Node | void {
        if (match.math(node)) {
            if (node.type === 'inlinemath') {
                // Inline math gets printed out directly.
                return {
                    type: 'string',
                    content: printRaw(node)
                };
            } else {
                // Here it would have to be display math. In which case the content will be wrapped inside a div.
                return htmlLike({
                    tag: 'div',
                    attributes: {
                        class: 'equation', // TODO: Find suitable class names and style this.
                    },
                    content: {
                        type: 'string',
                        content: printRaw(node)
                    }
                });
            }
        }

        // Here it would be an align environment or something of this kind.
        if (match.anyEnvironment(node) && node.type === 'mathenv') {
            return htmlLike({
                tag: 'div',
                attributes: {
                    class: 'equation', // TODO: Find suitable class names and style this.
                },
                content: {
                    type: 'string',
                    content: printRaw(node)
                }
            })
        }
    }

}

