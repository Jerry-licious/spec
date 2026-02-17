// Abstractly processes certain things. While running, collects errors.
import {ParsingMessage} from "./error";
import {on} from "node:events";

export class ParserLogger {
    readonly parent?: ParserLogger;

    readonly errors: ParsingMessage[];
    readonly warnings: ParsingMessage[];
    readonly infos: ParsingMessage[];
    readonly successes: ParsingMessage[];

    readonly onError?: (message: ParsingMessage) => void;
    readonly onWarning?: (message: ParsingMessage) => void;
    readonly onInfo?: (message: ParsingMessage) => void;
    readonly onSuccess?: (message: ParsingMessage) => void;

    constructor({ parent, onError, onWarning, onInfo, onSuccess }: {
        parent?: ParserLogger,
        onError?: (message: ParsingMessage) => void;
        onWarning?: (message: ParsingMessage) => void;
        onInfo?: (message: ParsingMessage) => void;
        onSuccess?: (message: ParsingMessage) => void;
    }) {
        this.errors = [];
        this.warnings = [];
        this.infos = [];
        this.successes = [];

        this.parent = parent;

        this.onError = onError;
        this.onWarning = onWarning;
        this.onInfo = onInfo;
        this.onSuccess = onSuccess;
    }

    addError(err: ParsingMessage) {
        this.errors.push(err);
        if (this.parent) {
            this.parent.addError(err);
        }
        if (this.onError) {
            this.onError(err);
        }
    }
    addWarning(warning: ParsingMessage) {
        this.warnings.push(warning);
        if (this.parent) {
            this.parent.addWarning(warning);
        }
        if (this.onWarning) {
            this.onWarning(warning);
        }
    }
    addInfo(info: ParsingMessage) {
        this.infos.push(info);
        if (this.parent) {
            this.parent.addInfo(info);
        }
        if (this.onInfo) {
            this.onInfo(info);
        }
    }
    addSuccess(success: ParsingMessage) {
        this.successes.push(success);
        if (this.parent) {
            this.parent.addSuccess(success);
        }
        if (this.onSuccess) {
            this.onSuccess(success);
        }
    }
}


