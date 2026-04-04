// For now, I will settle with converting the mathjax environments into barebone text nodes.
// In the future, mathjax may be rendered entirely online.
import {DisplayMath, Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {printRaw} from "@unified-latex/unified-latex-util-print-raw";
import {htmlLike} from "@unified-latex/unified-latex-util-html-like";
import {classes} from "./classes";
import {ParserLogger} from "../logging-base";
import {m, s} from "@unified-latex/unified-latex-builder";
import {toTagString} from "../../tag";
import {RefRenderer} from "./ref-renderer";
import {AsyncNodeRenderer, Log} from "./async-renderer";
import {tikz2Svg} from "./tikz";


export class MathRenderer extends AsyncNodeRenderer {
    preambleDump: string;
    refRenderer: RefRenderer;

    constructor({ logger, preambleDump, refRenderer }: { logger?: ParserLogger, preambleDump?: string, refRenderer: RefRenderer }) {
        super({ logger });

        this.preambleDump = preambleDump ?? '';
        this.refRenderer = refRenderer;
    }

    addParbreak(node: Node): Node[] {
        return [node, { type: "parbreak" }];
    }

    isTikzEnvironment(node: Node): boolean {
        return match.environment(node, "tikzcd") || match.environment(node, "tikzpicture");
    }

    isTikzPicture(node: DisplayMath) {
        return node.content.some((c) => this.isTikzEnvironment(c));
    }

    async renderTikzPicture(node: DisplayMath, addInfo: Log) {
        const tikzNode = node.content.find((c) => this.isTikzEnvironment(c))!;

        addInfo("Rendering tikz picture. Consider not using the compile all configuration if there is a large number of them.");

        const svg = await tikz2Svg(printRaw(tikzNode), this.preambleDump);

        addInfo("Finished rendering tikz picture.");

        return this.addParbreak(htmlLike({
            tag: 'tikz-svg',
            attributes: {
                class: classes.tikz,
            },
            content: {
                type: 'string',
                content: svg
            }
        }));
    }

    async render(node: Node, addError: Log, addInfo: Log, addWarning: Log): Promise<Node | Node[] | void> {
        if (match.math(node)) {
            if (node.type === 'inlinemath') {
                // Inline math gets printed out directly.
                return {
                    type: 'string',
                    content: printRaw(node)
                };
            }

            // Here I check for a special case: a tikz picture.
            // I identify an equation with at least one tikz environment to be a tikz picture.
            if (this.isTikzPicture(node)) {
                return await this.renderTikzPicture(node, addInfo);
            }

            // Render the refs in math mode.
            this.refRenderer.process(node);

            // Here it would have to be display math. In which case the content will be wrapped inside a div.
            return this.addParbreak(htmlLike({
                tag: 'div',
                attributes: {
                    class: classes.displayEquation,
                },
                content: {
                    type: 'string',
                    content: printRaw(node)
                }
            }));
        }

        // Here it would be an align environment or something of this kind.
        if (match.anyEnvironment(node) && node.type === 'mathenv') {
            // If the node does have a label, I will inject an extra command for its numbering.
            if (node.meta?.label && !node.meta.numberingInjected) {
                node.content.push(m('tag', s(node.meta.numbering?.join('.') ?? '?')));
                node.meta.numberingInjected = true;
            }

            // Render the refs in math mode.
            this.refRenderer.process(node);

            return this.addParbreak(htmlLike({
                tag: 'div',
                attributes: {
                    class: classes.displayEquation,
                    id: node.meta?.tag ? toTagString(node.meta.tag) : ''
                },
                content: {
                    type: 'string',
                    content: printRaw(node)
                }
            }))
        }
    }
}

