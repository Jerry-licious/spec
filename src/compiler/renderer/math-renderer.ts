// For now, I will settle with converting the mathjax environments into barebone text nodes.
// In the future, mathjax may be rendered entirely online.
import {NodeRenderer} from "./renderer";
import {DisplayMath, Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {printRaw} from "@unified-latex/unified-latex-util-print-raw";
import {htmlLike} from "@unified-latex/unified-latex-util-html-like";
import {classes} from "./classes";
import {ParserLogger} from "../logging-base";
import {getEnvName, multiRowMathEnvironments, splitMathRows} from "../util";
import {toTagString} from "../../tag";

import {createSyncFn} from "synckit";
import { resolve } from 'path';

const tikz2Svg = createSyncFn(
    resolve(__dirname, './tikz-worker')
);

// Ref commands that can appear inside math and should be resolved by the compiler
// rather than left for MathJax (which can only resolve labels on the same page).
const mathRefCommands = new Set<string>(['ref', 'eqref']);


export class MathRenderer extends NodeRenderer {
    preambleDump: string;

    constructor({ logger, preambleDump }: { logger?: ParserLogger, preambleDump?: string }) {
        super({ logger });

        this.preambleDump = preambleDump ?? '';
    }

    // Resolve refs and strip labels from math content before passing to MathJax.
    // This ensures equation references are context-independent (the compiler's numbering
    // is used, not MathJax's page-local label resolution) and prevents namespace
    // conflicts when the same equation appears on multiple unit pages.
    private resolveMathContent(content: Node[]): string {
        return content.map((c: Node) => {
            // Replace \ref and \eqref with compiler-resolved text.
            if (match.anyMacro(c) && mathRefCommands.has(c.content)
                && c.refMeta && typeof c.refMeta.text === 'string') {
                return c.refMeta.text;
            }
            // Strip \label — the compiler manages labels, not MathJax.
            if (match.macro(c, 'label')) return '';
            // Strip \nonumber — the compiler controls numbering via \tag{}.
            if (match.macro(c, 'nonumber')) return '';
            // Strip \tag — already handled or passed through by the renderer.
            if (match.macro(c, 'tag')) return '';
            return printRaw(c);
        }).join('');
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
                // Inline math: resolve any \ref/\eqref and strip \label before
                // passing to MathJax, so refs work regardless of which unit page
                // the math appears on.
                const inner = this.resolveMathContent(node.content);
                return {
                    type: 'string',
                    content: `$${inner}$`
                };
            }

            // Here I check for a special case: a tikz picture.
            // I identify an equation with at least one tikz environment to be a tikz picture.
            if (this.isTikzPicture(node)) {
                return this.renderTikzPicture(node);
            }


            // Display math: resolve refs and strip labels.
            const displayInner = this.resolveMathContent(node.content);
            return htmlLike({
                tag: 'div',
                attributes: {
                    class: classes.displayEquation,
                },
                content: {
                    type: 'string',
                    content: `\\[${displayInner}\\]\n`
                }
            });
        }

        // Here it would be an align environment or something of this kind.
        if (match.anyEnvironment(node) && node.type === 'mathenv') {
            // For numbered equation environments, inject \tag{N} so the displayed number
            // matches the custom numbering system. Labels are stripped (the compiler
            // resolves all refs) to avoid namespace conflicts across unit pages.
            if (getEnvName(node.env) === 'equation' && node.meta) {
                const hasCustomTag = !!(node.meta as any).customTag;
                const hasNumbering = !!node.meta.numbering;

                if (hasCustomTag || hasNumbering) {
                    const rawContent = this.resolveMathContent(node.content);
                    // Re-inject custom \tag{} or use auto-numbering.
                    const tagDirective = hasCustomTag
                        ? `\\tag{${(node.meta as any).customTag}}`
                        : `\\tag{${node.meta.numbering!.join('.')}}`;
                    return htmlLike({
                        tag: 'div',
                        attributes: {
                            class: classes.displayEquation,
                            ...(node.meta.tag ? { id: `eq-${toTagString(node.meta.tag)}` } : {}),
                        },
                        content: {
                            type: 'string',
                            content: `\\begin{equation}${tagDirective}${rawContent}\\end{equation}\n`
                        }
                    });
                }
            }

            const envName = getEnvName(node.env);

            // Multi-row environments (align): inject \tag{N} per row.
            if (multiRowMathEnvironments.has(envName) && node.meta?.equationRows) {
                const rows = splitMathRows(node.content);
                const equationRows = (node.meta as any).equationRows as { numbering?: number[]; label?: string; customTag?: string; nonumber?: boolean }[];

                const renderedRows = rows.map((row, i) => {
                    const rowContent = this.resolveMathContent(row);
                    const rowData = equationRows[i];
                    let tag = '';
                    if (rowData?.customTag) {
                        // Re-inject the custom \tag since resolveMathContent stripped it.
                        tag = `\\tag{${rowData.customTag}}`;
                    } else if (rowData?.nonumber) {
                        // No tag, no number.
                        tag = '\\notag';
                    } else if (rowData?.numbering) {
                        tag = `\\tag{${rowData.numbering.join('.')}}`;
                    }
                    return `${tag}${rowContent}`;
                });

                return htmlLike({
                    tag: 'div',
                    attributes: {
                        class: classes.displayEquation,
                        ...(node.meta.tag ? { id: `eq-${toTagString(node.meta.tag)}` } : {}),
                    },
                    content: {
                        type: 'string',
                        content: `\\begin{${envName}}${renderedRows.join('\\\\')}\\end{${envName}}\n`
                    }
                });
            }

            // Generic fallback for other math environments.
            const mathEnvContent = this.resolveMathContent(node.content);
            return htmlLike({
                tag: 'div',
                attributes: {
                    class: classes.displayEquation,
                },
                content: {
                    type: 'string',
                    content: `\\begin{${envName}}${mathEnvContent}\\end{${envName}}\n`
                }
            })
        }
    }
}

