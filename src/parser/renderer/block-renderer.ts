import {NodeRenderer} from "./renderer";
import {Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {htmlLike} from "@unified-latex/unified-latex-util-html-like";
import {classes} from "./classes";
import { s } from '@unified-latex/unified-latex-builder';
import {wrapPars} from "@unified-latex/unified-latex-to-hast";

export class BlockRenderer extends NodeRenderer {
    blockNames: Map<string, string>;

    constructor({blockNames}: {blockNames: Map<string, string>}) {
        super();

        this.blockNames = blockNames;
    }

    render(node: Node): Node | void {
        if (!(match.environment(node) && this.blockNames.has(node.env))) return;
        if (!node.meta) {
            this.addWarning('Block is missing metadata.');
            return;
        }

        const blockName = this.blockNames.get(node.env)!!;
        const blockTitle = node.meta.title ?? [];

        return htmlLike({
            tag: 'div',
            attributes: {
                class: classes.blockEnvironment,
            },
            content: wrapPars([
                htmlLike({
                    tag: 'strong', // TODO: Maybe a better tag can be used for this.
                    attributes: {
                        class: classes.blockTitle,
                    },
                    content: [
                        s(node.meta.numbering && node.meta.numbering.length ?
                            `${blockName} ${node.meta.numbering.join('.')}` : blockName),
                        // If there is a block title, render it.
                        ...blockTitle.length ? [
                            s('('),
                            ...blockTitle,
                            s(')')
                        ] : []
                    ]
                }),
                ...node.content
            ])
        })
    }
}