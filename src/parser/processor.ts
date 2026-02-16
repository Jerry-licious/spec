// Abstractly processes certain things. While running, collects errors.
export abstract class AbstractProcessor<I, O, E> {
    readonly errors: E[];
    readonly warnings: E[];
    readonly infos: E[];

    constructor() {
        this.errors = [];
        this.warnings = [];
        this.infos = [];
    }

    addError(err: E) {
        this.errors.push(err);
        console.log(err);
    }
    addWarning(warning: E) {
        this.warnings.push(warning);
        console.log(warning);
    }
    addInfo(info: E) {
        this.infos.push(info);
        console.log(info);
    }

    abstract process(input: I): O;
}


