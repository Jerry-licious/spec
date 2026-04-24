import {DocumentVisitor} from "../visitor";
import {Argument, Node} from "@unified-latex/unified-latex-types";
import {SKIP, VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {m, s} from "@unified-latex/unified-latex-builder";
import {pgfkeysArgToObject} from "@unified-latex/unified-latex-util-pgfkeys";
import {getTextShallow} from "../util";
import {replaceNode} from "@unified-latex/unified-latex-util-replace";


function toLetters(n: number) {
    let result = '';
    while (n > 0) {
        n--;
        result = String.fromCharCode(97 + (n % 26)) + result;
        n = Math.floor(n / 26);
    }
    return result;
}

function toRoman(n: number) {
    const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
    const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
    let result = '';
    for (let i = 0; i < vals.length; i++) {
        while (n >= vals[i]) {
            result += syms[i];
            n -= vals[i];
        }
    }
    return result;
}



// The system provided by LaTeX to Hast is pretty good, so I prefer to not get in the way of it.
// However, the ordered lists provided by the compiler use the 1., 2., 3., format instead of the
// (1), (2), (3), ..., format.
// As such, my method is to simply inject these custom numberings as a parameter during processing.
export class ItemNumberer extends DocumentVisitor {
    renderNumbering(label: Node[], number: number) {
        const cloned = structuredClone(label);

        replaceNode(cloned, (node: Node | Argument) => {
            if (match.argument(node)) return;
            if (match.macro(node, 'alph')) return s(toLetters(number).toLowerCase());
            if (match.macro(node, 'Alph')) return s(toLetters(number).toUpperCase());
            if (match.macro(node, 'arabic')) return s(number.toString());
            if (match.macro(node, 'roman')) return s(toRoman(number).toLowerCase());
            if (match.macro(node, 'Roman')) return s(toRoman(number).toUpperCase());
        });

        return cloned;
    }


    visit(node: Node, visitInfo: VisitInfo): void | typeof SKIP {
        if (!match.environment(node, 'enumerate')) return;

        // Accepted arguments are `start` and
        const args = node.args ? pgfkeysArgToObject(node.args[0]) : {};

        let label = parseInt(getTextShallow(args['start'])) || 0;
        const numbering = args['label'] ?? [s('('), m('arabic'), s(')')];

        for (const child of node.content) {
            if (!match.macro(child, 'item')) continue;
            label++;

            // The custom number appears to be in position 1, of all things.
            if (!child.args || !child.args[1]) continue;
            // Do not overwrite existing custom numbering.
            if (child.args[1].content.length !== 0) continue;

            child.args[1].content = this.renderNumbering(numbering, label);
        }
    }
}