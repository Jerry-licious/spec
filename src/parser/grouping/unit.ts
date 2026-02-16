import {Node} from "@unified-latex/unified-latex-types";
import {printRaw} from "@unified-latex/unified-latex-util-print-raw";
import {createHash} from "crypto";


// IR units are intermediate representations that come with more structure than merely attaching nodes with metadata.
// IR units are expected to have tags and numbers.
// They are "units" because each unit comes with its own tag and page.
export abstract class IRUnit {
    readonly tag: number;
    readonly numbering: number[];

    // The parent is typically assigned *after* the unit is created, so it's not read-only.
    parent?: IRUnit;

    // From what kind of node did this unit originate?
    readonly sourceNodeType: 'environment' | 'macro';
    readonly sourceNodeName: string;

    // Chapter/Section/Part/Theorem/etc
    readonly name?: string;
    readonly label?: string;

    // Custom title for the node.
    readonly title: Node[];

    readonly mainContent: Node[];

    constructor({parent, mainContent, sourceNodeType, sourceNodeName, name, label, title, tag, numbering}: {
        parent?: IRUnit;
        mainContent?: Node[];
        sourceNodeType: 'environment' | 'macro';
        sourceNodeName: string;
        name: string;
        label?: string;
        title?: Node[];
        tag: number;
        numbering?: number[];
    }) {
        this.parent = parent;
        this.mainContent = mainContent ?? [];

        this.sourceNodeType = sourceNodeType;
        this.sourceNodeName = sourceNodeName;

        this.name = name;
        this.label = label;

        this.title = title ?? [];

        this.tag = tag;
        this.numbering = numbering ?? [];
    }

    hash(): string {
        return createHash('sha256').update(JSON.stringify(this.hashData())).digest('hex');
    }

    // Data used to compute a hash of the unit.
    hashData(): Record<string, string> {
        return {
            numbering: this.numbering.join('.'),
            sourceNodeType: this.sourceNodeType,
            sourceNodeName: this.sourceNodeName,
            title: this.title ? this.title.map((n) => printRaw(n)).join('') : '',
            content: this.mainContent.map((n) => printRaw(n)).join('\n'),
        }
    }
}

