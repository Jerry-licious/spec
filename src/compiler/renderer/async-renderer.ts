import {ParserLogger} from "../logging-base";
import {Argument, Node} from "@unified-latex/unified-latex-types";
import {NodeContext, ParsingMessage} from "../error";
import {match} from "@unified-latex/unified-latex-util-match";
import {replaceNode} from '@unified-latex/unified-latex-util-replace';
import {getContext} from "../util";
import {visit} from "@unified-latex/unified-latex-util-visit";


export type Log = (err: ParsingMessage | string) => void;

// Walks through the entire tree to compute all async renderings, and then replaces the tree.
// Does not work if a renderer depends on its own overwriting, and may cause unnecessary renderings.
// Not the perfect solution, but better than trying to call an async function in a sync function.
export abstract class AsyncNodeRenderer {
    logger: ParserLogger;
    
    constructor({ logger }: { logger?: ParserLogger }) {
        this.logger = logger ?? new ParserLogger({});
    }

    abstract render(node: Node, addError: Log, addInfo: Log, addWarning: Log): Promise<Node | Node[] | null | void>;


    async process(input: Node): Promise<void> {
        const promises: Promise<void>[] = [];

        // Run through the tree to collect promises.
        visit(input, (node: Node | Argument) => {
            if (match.argument(node)) return;

            // The context is no longer easily accessible if it keeps getting overwritten.
            // As such the logger functions must be passed in.
            const context = getContext(node);
            const addError = (err: ParsingMessage | string) => {
                if (typeof err === "string") {
                    this.logger.error({ context, message: err });
                } else {
                    this.logger.error({ context, ...err });
                }
            }
            const addWarning = (err: ParsingMessage | string) => {
                if (typeof err === "string") {
                    this.logger.warn({ context, message: err });
                } else {
                    this.logger.warn({ context, ...err });
                }
            }
            const addInfo = (err: ParsingMessage | string) => {
                if (typeof err === "string") {
                    this.logger.info({ context, message: err });
                } else {
                    this.logger.info({ context, ...err });
                }
            }

            promises.push(this.render(node, addError, addWarning, addInfo).then((result) => {
                node.meta = {
                    ...node.meta, asyncRenderResult: result
                };
            }))
        });

        await Promise.all(promises);

        // At this point, the renders would have completed.
        replaceNode(input, (node: Node | Argument) => {
            if (match.argument(node)) return;
            if (!node.meta) return;

            const result = node.meta.asyncRenderResult;
            // Wipe the result.
            if (result !== undefined) { node.meta.asyncRenderResult = undefined; }

            return result;
        });
    }

    asPlugin(): () => (root: Node) => void {
        return () => (async (root: Node) => this.process(root));
    }
}