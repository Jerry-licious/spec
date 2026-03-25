import {DocumentVisitor} from "../visitor";
import {Node} from "@unified-latex/unified-latex-types";
import {SKIP, VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {getArgumentText} from "../util";
import path from "node:path";


export class GraphicsPathAssigner extends DocumentVisitor {
    witnessedPaths: Set<string> = new Set<string>();

    constructor() {
        super({});

        this.witnessedPaths = new Set<string>();
    }

    visit(node: Node, visitInfo: VisitInfo): void | typeof SKIP {
        if (!match.macro(node, 'includegraphics')) return;
        if (!node.args || node.args.length < 4 || !node.meta?.sourceFile) return;

        // The path of the target appears in position 3.
        const targetPath = getArgumentText(node.args[3]);
        const fullPath = path.relative(process.cwd(),
            path.resolve(path.join(path.dirname(node.meta.sourceFile), targetPath)));

        this.witnessedPaths.add(fullPath);
        node.meta.sourceFile = fullPath;
    }
}

