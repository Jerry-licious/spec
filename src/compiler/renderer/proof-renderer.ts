import {NodeRenderer} from "./renderer";
import {Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {htmlLike} from "@unified-latex/unified-latex-util-html-like";
import {classes} from "./classes";
import {s} from "@unified-latex/unified-latex-builder";
import {wrapPars} from "@unified-latex/unified-latex-to-hast";


export class ProofRenderer extends NodeRenderer {
    render(node: Node): Node | void {
        if (!match.environment(node, 'proof')) return;

        return htmlLike({
            tag: 'div',
            attributes: {
                class: classes.proof,
            },
            content: wrapPars([
                htmlLike({
                    tag: 'i',
                    attributes: {
                        class: classes.proofIntro,
                    },
                    content: s('Proof. ')
                }),
                ...node.content,
                htmlLike({
                    tag: 'span',
                    attributes: {
                        class: classes.qed,
                    },
                    content: s('$\\square$')
                })
            ])
        });
    }
}
