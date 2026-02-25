import {ParserLogger} from "~/compiler/logging-base";
import type {Element} from 'hast';

export abstract class HastVisitor {
    logger: ParserLogger;

    constructor({ logger }: { logger?: ParserLogger }) {
        this.logger = logger ?? new ParserLogger({});
    }

    abstract visit(node: Element): void;

    process(input: Element): void {
        this.visit(input);

        for (const child of input.children) {
            if (child.type === 'element') {
                this.process(child as Element);
            }
        }
    }

    asPlugin(): () => (root: Element) => void {
        return () => ((root: Element) => this.process(root));
    }
}