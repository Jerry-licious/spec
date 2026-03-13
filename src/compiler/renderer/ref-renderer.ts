import {NodeRenderer} from "./renderer";
import {Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {htmlLike} from '@unified-latex/unified-latex-util-html-like';
import {classes} from "./classes";
import {toTagString} from "../../tag";


const refCommands = new Set<string>(['ref', 'autoref', 'hyperref']);


export class RefRenderer extends NodeRenderer {
    render(node: Node): Node | void {
        if (!(match.anyMacro(node) && refCommands.has(node.content))) return;
        if (!node.refMeta) {
            this.addWarning('Ref macro is missing metadata.');
            return;
        }

        if (node.refMeta.targetTag >= 0) {
            return htmlLike({
                tag: 'a',
                attributes: {
                    href: `/t/${toTagString(node.refMeta.targetTag)}`,
                    class: classes.ref
                },
                content: typeof node.refMeta.text === 'string' ? {
                    type: "string",
                    content: node.refMeta.text
                } : node.refMeta.text
            });
        }

        return htmlLike({
            tag: 'a',
            attributes: {
                href: `/404`,
                class: classes.refInvalid
            },
            content: typeof node.refMeta.text === 'string' ? {
                type: "string",
                content: node.refMeta.text
            } : node.refMeta.text
        });

    }
}

