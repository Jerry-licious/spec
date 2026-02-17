import {Division} from "./division";
import {DocumentVisitor} from "../visitor";
import {Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {s} from "@unified-latex/unified-latex-builder";



export class MainCollector extends DocumentVisitor {
    title: string;

    // All child divisions are assumed to be already collected in this map.
    // Children divisions will be collected into this.
    existingDivisions: Map<number, Division>;
    constructor({title, existingDivisions}: {
        title: string;
        existingDivisions?: Map<number, Division>;
    }) {
        super();

        this.title = title;
        this.existingDivisions = existingDivisions ?? new Map<number, Division>();
    }

    visit(node: Node, visitInfo: VisitInfo): void {
        // The main collector only starts at the root.
        if (node.type !== 'root') return;

        // Siblings of the marker will be collected as its content until another marker is reached.
        let collectContent = true;
        const mainContent: Node[] = [];
        const children: Division[] = [];
        for (const contentElement of node.content) {
            // Collect parts as children.
            if (match.macro(contentElement, 'part')) {
                collectContent = false;
                if (!contentElement.meta || !contentElement.meta.tag) {
                    this.addError('Division marker is missing metadata.');
                    continue;
                }
                if (!this.existingDivisions.has(contentElement.meta.tag)) {
                    this.addError('Division has not been collected yet.');
                    continue;
                }
                children.push(this.existingDivisions.get(contentElement.meta.tag)!!);
            } else if (collectContent && !match.argument(contentElement)) {
                // Otherwise, add the sibling to the content of the node.
                mainContent.push(contentElement);
            }
        }

        const division = new Division({
            sourceNodeName: 'document',
            name: 'document',
            title: [s(this.title)],
            label: '',
            tag: 0,
            numbering: [],
            mainContent
        });
        for (const child of children) {
            division.addChild(child);
        }

        // The 0 tag is reserved for the index page.
        this.existingDivisions.set(0, division);
    }
}