import {HastVisitor} from "./transformer";
import {Element} from "hast";

export class TikzExtractor extends HastVisitor {
    visit(node: Element): void {
        if (node.tagName !== 'tikz-svg') return;
        if (node.children.length != 1) return;

        node.tagName = 'div';

        // Simply replace the text node with a raw node.
        // @ts-ignore
        node.children[0].type = "raw";
    }
}