// For now, I will settle with converting the mathjax environments into barebone text nodes.
// In the future, mathjax may be rendered entirely online.
import {NodeRenderer} from "./renderer";
import {DisplayMath, Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {printRaw} from "@unified-latex/unified-latex-util-print-raw";
import {htmlLike} from "@unified-latex/unified-latex-util-html-like";
import {classes} from "./classes";
import {ParserLogger} from "../logging-base";

import {createSyncFn} from "synckit";
import { resolve } from 'path';

const tikz2Svg = createSyncFn(
    resolve(__dirname, './tikz-worker')
);

export class MathRenderer extends NodeRenderer {
    preambleDump: string;

    constructor({ logger, preambleDump }: { logger?: ParserLogger, preambleDump?: string }) {
        super({ logger });

        this.preambleDump = preambleDump ?? '';
    }

    isTikzPicture(node: DisplayMath) {
        return node.content.some((c) => match.environment(c, "tikzcd"));
    }

    renderTikzPicture(node: DisplayMath) {
        const tikzNode = node.content.find((c) => match.environment(c, "tikzcd"))!;

        this.addInfo("Rendering tikz picture. Consider not using the compile all configuration if there is a large number of them.");

        const svg = tikz2Svg(printRaw(tikzNode), this.preambleDump);

        this.addInfo("Finished rendering tikz picture.");

        return htmlLike({
            tag: 'tikz-svg',
            attributes: {
                class: classes.tikz,
            },
            content: {
                type: 'string',
                content: svg
            }
        });
    }

    render(node: Node): Node | void {
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
                return this.renderTikzPicture(node);
            }


            // Here it would have to be display math. In which case the content will be wrapped inside a div.
            return htmlLike({
                tag: 'div',
                attributes: {
                    class: classes.displayEquation,
                },
                content: {
                    type: 'string',
                    content: printRaw(node)
                }
            });
        }

        // Here it would be an align environment or something of this kind.
        if (match.anyEnvironment(node) && node.type === 'mathenv') {
            return htmlLike({
                tag: 'div',
                attributes: {
                    class: classes.displayEquation,
                },
                content: {
                    type: 'string',
                    content: printRaw(node)
                }
            })
        }
    }
}

