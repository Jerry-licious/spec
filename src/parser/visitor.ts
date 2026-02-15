import {Argument, Node} from "@unified-latex/unified-latex-types";
import {Location, ParsingMessage} from "./error";
import {AbstractProcessor} from "./processor";
import {visit} from "@unified-latex/unified-latex-util-visit";
import {getLocation} from "./util";
import {match} from "@unified-latex/unified-latex-util-match";

// For extracting information from documents. Typically a document visitor will go through the document through the
// "visit" function to gather information and attach metadata.
// To simplify error messaging, I will have the visitor store the current location. This means that concurrent things
// should never be done through this type of visitors.
// Which aligns with my plan that these document visitors are "linear", and require the context of the whole document.
export abstract class DocumentVisitor extends AbstractProcessor<Node, void, ParsingMessage> {
    currentLocation?: Location;

    abstract visit(node: Node): void;

    addError(err: ParsingMessage | string) {
        if (typeof err === "string") {
            super.addError({
                location: this.currentLocation,
                message: err
            });
        } else {
            super.addError({
                location: this.currentLocation,
                ...err
            });
        }
    }
    addInfo(info: ParsingMessage | string) {
        if (typeof info === "string") {
            super.addInfo({
                location: this.currentLocation,
                message: info
            });
        } else {
            super.addInfo({
                location: this.currentLocation,
                ...info
            });
        }
    }
    addWarning(warning: ParsingMessage | string) {
        if (typeof warning === "string") {
            super.addWarning({
                location: this.currentLocation,
                message: warning
            });
        } else {
            super.addWarning({
                location: this.currentLocation,
                ...warning
            });
        }
    }

    process(input: Node): void {
        visit(input, (node: Node | Argument) => {
            if (match.argument(node)) return;

            this.currentLocation = getLocation(node);

            this.visit(node);
        });
    }
}