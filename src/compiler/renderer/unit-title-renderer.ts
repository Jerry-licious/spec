import {NodeRenderer} from "./renderer";
import {Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {documentDividersSet} from "../../unit-types";
import {htmlLike} from "@unified-latex/unified-latex-util-html-like";
import {toTagString} from "../../tag";
import {classes} from "./classes";
import {s} from "@unified-latex/unified-latex-builder";


const dividerTags = new Map<string, string>([
    ['part', 'h2'],
    ['chapter', 'h3'],
    ['section', 'h4'],
    ['subsection', 'h5'],
    ['subsubsection', 'h5'],
]);


export class UnitTitleRenderer extends NodeRenderer {
    render(node: Node): Node | void | null {
        if (!match.macro(node) || !documentDividersSet.has(node.content) || !node.meta?.tag) return;

        return htmlLike({
            tag: dividerTags.get(node.content)!,
            content: htmlLike({
                tag: 'a',
                attributes: {
                    href: `/t/${toTagString(node.meta.tag)}`,
                    class: classes.divisionTitle
                },
                content: [
                    s(node.meta.numbering && node.meta.numbering.length ?
                        `${node.meta.numbering.join('.')} ` : ''),
                    ...node.args ? node.args.flatMap((a) => a.content) : []
                ],
            })
        });
    }
}