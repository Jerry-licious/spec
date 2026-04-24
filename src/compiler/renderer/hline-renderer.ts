import {HastVisitor} from "./transformer";
import {Element} from "hast";

/*
* As of now, the compiler will leech off of the given implementation of *tabular* given by
* Unified. The problem lies in a lack of production of *\hline* elements.
* More precisely, \hline elements are rendered as <tr><td> </td><tr> or as <tr></tr>.
* As such, the present solution is to capture these cases and provide them a particular style.
* */
export class HLineRenderer extends HastVisitor {
    visit(node: Element): void {
        if (node.tagName !== 'tr') return;
        if (node.children.length > 1) return;

        // The former case is distinguished by the presence of a <td> element with just a space inside.
        if (node.children.length === 1) {
            if (node.children.filter(c => c.type === 'text')
                .map(c => c.data).join('').trim().length > 0) return;
        }

        // Remove all the node's children.
        node.children = [];
        // then add a hline style to it.
        node.properties.className = node.properties.className ?? '' + ' hline';
    }
}