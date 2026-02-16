import {IRUnit} from "./unit";
import {Node} from "@unified-latex/unified-latex-types";


// Divisions include parts chapters, sections, subsections.
// Their main content corresponds to the content between its beginning and the first subdivision. For example
// \chapter{Chapter}
//
// Paragraph...
//
// \section{Section 1}
//
// Section content
//
// The above code should have Paragraph... included as its main content.
// In addition, divisions will include children: parts will keep a list of its chapters and chapters will keep a list of
// its sections.
export class Division extends IRUnit {
    children: Division[];

    constructor(args: {
        parent?: IRUnit;
        mainContent: Node[];
        sourceNodeName: string;
        name: string;
        title: Node[];
        label?: string;
        tag: number;
        numbering: number[];
        children?: Division[];
    }) {
        super({
            ...args,
            sourceNodeType: "macro"
        });

        this.children = args.children ?? [];
    }

    addChild(child: Division) {
        this.children.push(child);
        child.parent = this;
    }
}