// Abstractly processes certain things. While running, collects errors.
export abstract class DocumentProcessor<I, O, E> {
    errors: E[];
    warnings: E[];

    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    addError(err: E) {
        this.errors.push(err);
    }
    addWarning(warning: E) {
        this.warnings.push(warning)
    }

    abstract process(input: I): O;
}