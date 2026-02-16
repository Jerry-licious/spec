import {NodeRenderer} from "./renderer";
import {Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import { htmlLike } from '@unified-latex/unified-latex-util-html-like';


const refCommands = new Set<string>(['ref', 'autoref', 'hyperref']);


export class RefRenderer extends NodeRenderer {
    render(node: Node): Node | void {
        if (!(match.anyMacro(node) && refCommands.has(node.content))) return;
        if (!node.refMeta) {
            this.addWarning('Ref macro is missing metadata.');
            return;
        }

        return htmlLike({
            tag: 'a',
            attributes: {
                href: `/${node.refMeta.targetTag}`, // TODO: How to encode tags?
                class: 'ref' // TODO: style classes for a?
            },
            content: {
                type: "string",
                content: node.refMeta.text
            }
        });
    }
}

