// Abstractly processes certain things. While running, collects errors.
import {ParsingMessage} from "./error";

export class ParserLogger {
    readonly parent?: ParserLogger;

    readonly errors: ParsingMessage[];
    readonly warnings: ParsingMessage[];
    readonly infos: ParsingMessage[];

    constructor({ parent }: { parent?: ParserLogger }) {
        this.errors = [];
        this.warnings = [];
        this.infos = [];

        this.parent = parent;
    }

    addError(err: ParsingMessage) {
        this.errors.push(err);
        if (this.parent) {
            this.parent.addError(err);
        }
    }
    addWarning(warning: ParsingMessage) {
        this.warnings.push(warning);
        if (this.parent) {
            this.parent.addWarning(warning);
        }
    }
    addInfo(info: ParsingMessage) {
        this.infos.push(info);
        if (this.parent) {
            this.parent.addInfo(info);
        }
    }
}


