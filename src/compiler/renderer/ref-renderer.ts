import {NodeRenderer} from "./renderer";
import {Macro, Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {htmlLike} from '@unified-latex/unified-latex-util-html-like';
import {classes} from "./classes";
import {toTagString} from "../../tag";
import {IRUnit} from "../grouping";
import {ParserLogger} from "../logging-base";


const refCommands = new Set<string>(['ref', 'autoref', 'hyperref']);


export class RefRenderer extends NodeRenderer {
    tagUnitMap: Map<number, IRUnit>;
    constructor({ tagUnitMap, logger }: {
        tagUnitMap: Map<number, IRUnit>;
        logger: ParserLogger;
    }) {
        super({logger});

        this.tagUnitMap = tagUnitMap;
    }

    renderParasitic(node: Macro, target: IRUnit) {
        const targetTagString = toTagString(target.tag);
        const href = `/t/${toTagString(target.parent?.tag ?? 0)}#${targetTagString}`;

        // Essentially, if the ID is already present in the current page, there's no need to navigate to the parent page.
        // Instead, I should just go to the tag immediately.
        const fallback = `
        if (document.getElementById("${targetTagString}")) {
            location.hash = "${targetTagString}";
            return false;
        }
        `;

        return htmlLike({
            tag: 'a',
            attributes: {
                href, class: classes.ref,
                onclick: fallback
            },
            content: typeof node.refMeta?.text === 'string' ? {
                type: "string",
                content: node.refMeta.text
            } : node.refMeta?.text
        });
    }


    render(node: Node): Node | void {
        if (!(match.anyMacro(node) && refCommands.has(node.content))) return;
        if (!node.refMeta) {
            this.addWarning('Ref macro is missing metadata.');
            return;
        }

        if (node.refMeta.targetTag >= 0) {
            // If the tag refers to a parasitic unit, there will be a special handler.
            const targetNode = node.refMeta.targetTag ? this.tagUnitMap.get(node.refMeta.targetTag) : undefined;

            if (targetNode?.parasitic && targetNode.parent?.tag !== undefined) {
                return this.renderParasitic(node, targetNode);
            }

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

