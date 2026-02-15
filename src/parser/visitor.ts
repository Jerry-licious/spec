import {Argument, Node} from "@unified-latex/unified-latex-types";
import {NodeContext, ParsingMessage} from "./error";
import {AbstractProcessor} from "./processor";
import {visit, VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {getContext} from "./util";
import {match} from "@unified-latex/unified-latex-util-match";

// For extracting information from documents. Typically a document visitor will go through the document through the
// "visit" function to gather information and attach metadata.
// To simplify error messaging, I will have the visitor store the current location. This means that concurrent things
// should never be done through this type of visitors.
// Which aligns with my plan that these document visitors are "linear", and require the context of the whole document.
export abstract class DocumentVisitor extends AbstractProcessor<Node, void, ParsingMessage> {
    private currentContext?: NodeContext;

    abstract visit(node: Node, visitInfo: VisitInfo): void;

    addError(err: ParsingMessage | string) {
        if (typeof err === "string") {
            super.addError({
                location: this.currentContext,
                message: err
            });
        } else {
            super.addError({
                location: this.currentContext,
                ...err
            });
        }
    }
    addInfo(info: ParsingMessage | string) {
        if (typeof info === "string") {
            super.addInfo({
                location: this.currentContext,
                message: info
            });
        } else {
            super.addInfo({
                location: this.currentContext,
                ...info
            });
        }
    }
    addWarning(warning: ParsingMessage | string) {
        if (typeof warning === "string") {
            super.addWarning({
                location: this.currentContext,
                message: warning
            });
        } else {
            super.addWarning({
                location: this.currentContext,
                ...warning
            });
        }
    }

    process(input: Node): void {
        visit(input, (node: Node | Argument, info: VisitInfo) => {
            if (match.argument(node)) return;

            this.currentContext = getContext(node);

            this.visit(node, info);
        });
    }
}