import {NodeRenderer} from "./renderer";
import {Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {htmlLike} from "@unified-latex/unified-latex-util-html-like";
import {classes} from "./classes";

export class EnumerateRenderer extends NodeRenderer {
    render(node: Node): Node | Node[] | void | null {
        if (!match.environment(node, 'enumerate')) return;

        return [
            htmlLike({
                tag: 'ol',
                attributes: { class: classes.enumerate },
                content: node.content.filter((c) => match.macro(c, 'item'))
                    .map((item) => htmlLike({
                        tag: 'li',
                        content: [
                            // Position 1 = label, position 4 = content.
                            htmlLike({
                                tag: 'div', content: item.args![1].content,
                                attributes: { class: classes.enumerateMarker },
                            }),
                            htmlLike({
                                tag: 'div', content: item.args![3].content,
                                attributes: { class: classes.enumerateContent },
                            })
                        ]
                    }))
            }),
            // Additional parbreak to please the MathJax gods.
            { type: "parbreak" }
        ];
    }
}