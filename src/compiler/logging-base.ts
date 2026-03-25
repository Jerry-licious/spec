// Abstractly processes certain things. While running, collects errors.
import {ParsingMessage} from "./error";

export class ParserLogger {
    readonly parent?: ParserLogger;

    errors: number;
    warnings: number;
    infos: number;
    successes: number;

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
        this.errors = 0;
        this.warnings = 0;
        this.infos = 0;
        this.successes = 0;

        this.parent = parent;

        this.onError = onError;
        this.onWarning = onWarning;
        this.onInfo = onInfo;
        this.onSuccess = onSuccess;
    }

    error(msg: ParsingMessage | string, increment: boolean = true) {
        const error = typeof msg === 'string' ? {message: msg } : msg;

        if (increment) this.errors++;
        if (this.parent) {
            this.parent.error(error, increment);
        }
        if (this.onError) {
            this.onError(error);
        }
    }
    warn(msg: ParsingMessage | string, increment: boolean = true) {
        const warning = typeof msg === 'string' ? {message: msg } : msg;

        if (increment) this.warnings++;
        if (this.parent) {
            this.parent.warn(warning, increment);
        }
        if (this.onWarning) {
            this.onWarning(warning);
        }
    }
    info(msg: ParsingMessage | string, increment: boolean = true) {
        const info = typeof msg === 'string' ? {message: msg } : msg;

        if (increment) this.infos++;
        if (this.parent) {
            this.parent.info(info, increment);
        }
        if (this.onInfo) {
            this.onInfo(info);
        }
    }
    success(msg: ParsingMessage | string, increment: boolean = true) {
        const success = typeof msg === 'string' ? {message: msg } : msg;

        if (increment) this.successes++;
        if (this.parent) {
            this.parent.success(success, increment);
        }
        if (this.onSuccess) {
            this.onSuccess(success);
        }
    }

    // Reports on the number of errors/warnings accumulated.
    report(msg: string) {
        const messageContent = `${msg} (${this.numErrors} errors and ${this.numWarnings} warnings)`;
        if (this.numErrors > 0) {
            this.error(messageContent, false);
        } else {
            this.success(messageContent, false);
        }
    }

    get numWarnings() {
        return this.warnings
    }
    get numErrors() {
        return this.errors;
    }
}


