import {AbstractProcessor} from "../processor";
import {Argument, Node} from "@unified-latex/unified-latex-types";
import {NodeContext, ParsingMessage} from "../error";
import {match} from "@unified-latex/unified-latex-util-match";
import { replaceNode } from '@unified-latex/unified-latex-util-replace';
import {getContext} from "../util";



export abstract class NodeRenderer extends AbstractProcessor<Node, void, ParsingMessage> {
    private currentContext?: NodeContext;

    abstract render(node: Node): Node | null | void;

    addError(err: ParsingMessage | string) {
        if (typeof err === "string") {
            super.addError({
                context: this.currentContext,
                message: err
            });
        } else {
            super.addError({
                context: this.currentContext,
                ...err
            });
        }
    }
    addInfo(info: ParsingMessage | string) {
        if (typeof info === "string") {
            super.addInfo({
                context: this.currentContext,
                message: info
            });
        } else {
            super.addInfo({
                context: this.currentContext,
                ...info
            });
        }
    }
    addWarning(warning: ParsingMessage | string) {
        if (typeof warning === "string") {
            super.addWarning({
                context: this.currentContext,
                message: warning
            });
        } else {
            super.addWarning({
                context: this.currentContext,
                ...warning
            });
        }
    }

    process(input: Node): void {
        replaceNode(input, (node: Node | Argument) => {
            if (match.argument(node)) return;

            this.currentContext = getContext(node);

            return this.render(node);
        });
    }

    asPlugin(): () => (root: Node) => void {
        return () => ((root: Node) => this.process(root));
    }
}