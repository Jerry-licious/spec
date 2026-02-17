import {NodeRenderer} from "./renderer";
import {Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {htmlLike} from "@unified-latex/unified-latex-util-html-like";
import {classes} from "./classes";
import {s} from "@unified-latex/unified-latex-builder";

export class CiteRenderer extends NodeRenderer {
    render(node: Node): Node | void | null {
        if (!match.macro(node, 'cite')) return;
        if (!node.args || node.args.length < 2) {
            this.addError('Missing arguments for citation macro.');
            return;
        }
        if (!node.refMeta) {
            this.addError('Missing metadata for citation macro.');
            return;
        }

        return htmlLike({
            tag: 'span',
            attributes: {
                class: classes.cite,
            },
            content: [
                s('['),
                ...(node.args[0].content.length ? [
                    htmlLike({
                        tag: 'span',
                        attributes: {
                            class: classes.citeNote,
                        },
                        content: node.args[0].content
                    }),
                    s(', ')
                ] : []),
                htmlLike({
                    tag: 'a',
                    attributes: {
                        class: classes.citeRef,
                        href: `/${node.refMeta.targetTag}`
                    },
                    content: s(node.refMeta.text)
                }),
                s(']')
            ]
        })

        return undefined;
    }
}