import {HastVisitor} from "~/compiler/renderer/transformer";
import {Element} from "hast";

export class EmptyParagraphFilter extends HastVisitor {
    visit(node: Element): void {
        node.children = node.children.filter((c) => {
            if (c.type !== 'element') return true;
            if (c.tagName !== 'p') return true;
            return c.children.some((cc) => (cc.type !== 'text' || cc.value.trim().length > 0))
        });
    }
}