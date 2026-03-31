import {HastVisitor} from "./transformer";
import {Element} from "hast";

// Replace the general footnote numbers with specific foot numbers for each page.
export class FootnoteRefSubstitute extends HastVisitor {
    globalLocalMap: Map<number, number>;

    constructor(globalLocalMap: Map<number, number>) {
        super({});

        this.globalLocalMap = globalLocalMap;
    }


    visit(node: Element): void {
        if (node.tagName !== 'a') return;
        if (!node.properties.footnoteNumber) return;

        const globalNumber = Number(node.properties.footnoteNumber);

        if (this.globalLocalMap.has(globalNumber)) {
            node.children = [{
                type: 'text',
                value: `[${this.globalLocalMap.get(globalNumber)}]`,
            }]
        }
    }
}