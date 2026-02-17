// Abstractly processes certain things. While running, collects errors.
import {ParsingMessage} from "./error";

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

    error(msg: ParsingMessage | string) {
        const error = typeof msg === 'string' ? {message: msg } : msg;

        this.errors.push(error);
        if (this.parent) {
            this.parent.error(error);
        }
        if (this.onError) {
            this.onError(error);
        }
    }
    warn(msg: ParsingMessage | string) {
        const warning = typeof msg === 'string' ? {message: msg } : msg;

        this.warnings.push(warning);
        if (this.parent) {
            this.parent.warn(warning);
        }
        if (this.onWarning) {
            this.onWarning(warning);
        }
    }
    info(msg: ParsingMessage | string) {
        const info = typeof msg === 'string' ? {message: msg } : msg;

        this.infos.push(info);
        if (this.parent) {
            this.parent.info(info);
        }
        if (this.onInfo) {
            this.onInfo(info);
        }
    }
    success(msg: ParsingMessage | string) {
        const success = typeof msg === 'string' ? {message: msg } : msg;

        this.successes.push(success);
        if (this.parent) {
            this.parent.success(success);
        }
        if (this.onSuccess) {
            this.onSuccess(success);
        }
    }

    get numWarnings() {
        return this.warnings.length;
    }
    get numErrors() {
        return this.errors.length;
    }
}


