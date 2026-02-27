import {IRUnit} from "./unit";
import {Node} from "@unified-latex/unified-latex-types";
import {UnitData} from "../../db/unit-data";


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

    addChild(child: Division, setParent: boolean = true) {
        this.children.push(child);

        if (setParent) child.parent = this;
    }

    hashData(): Record<string, string> {
        return {
            ...super.hashData(),
            children: this.children.map((c) => `${c.tag}:${c.name}:${c.titleText}`).join('\n')
        };
    }

    renderToUnitData(allUnits: Map<number, IRUnit>, renderer: (node: Node) => string): UnitData {
        const data = super.renderToUnitData(allUnits, renderer);

        data.children = this.children.length ? this.children.map((c) => c.linkTarget!) : null;

        return data;
    }
}