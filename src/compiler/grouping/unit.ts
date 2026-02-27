import {Node} from "@unified-latex/unified-latex-types";
import {printRaw} from "@unified-latex/unified-latex-util-print-raw";
import {createHash} from "crypto";
import {ReferenceCollector, TextCollector} from "../metadata";
import {AppDataSource} from "../../db";
import {wrapPars} from "@unified-latex/unified-latex-to-hast";
import {UnitData} from "../../db/unit-data";
import {LinkTarget} from "../../db/link-target";
import {macrosToOmit} from "../../unit-types";

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
    readonly name: string;
    readonly label?: string;

    // Custom title for the node.
    readonly title: Node[];

    readonly mainContent: Node[];

    readonly titleText: string;

    textContent: string;

    // Tags directly referenced by this unit.
    directReferences: Set<number>;
    // Tags that directly reference this unit.
    directlyReferencedBy: Set<number>;

    indirectReferences: Set<number>;
    indirectlyReferencedBy: Set<number>;

    computedHash?: string;

    // All the information needed to represent a link to this unit.
    linkTarget?: LinkTarget;

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

        this.titleText = this.title.map((n) => printRaw(n)).join('');

        // Initialise the list of direct references here.
        const referenceCollector = new ReferenceCollector();
        this.title.forEach((n) => referenceCollector.process(n));
        this.mainContent.forEach((n) => referenceCollector.process(n));
        this.directReferences = referenceCollector.referencedTags;

        const textCollector = new TextCollector({ macrosToOmit: macrosToOmit });
        this.title.forEach((n) => textCollector.process(n));
        this.mainContent.forEach((n) => textCollector.process(n));
        this.textContent = textCollector.getCollectedText();

        this.directlyReferencedBy = new Set<number>();
        this.indirectReferences = new Set<number>();
        this.indirectlyReferencedBy = new Set<number>();
    }

    hash(refresh: boolean = false): string {
        if (!this.computedHash || refresh) {
            this.computedHash = createHash('sha256').update(JSON.stringify(this.hashData())).digest('hex');
        }

        return this.computedHash;
    }

    parentTagChain(): number[] {
        if (this.parent) {
            return [...this.parent.parentTagChain(), this.parent.tag];
        }
        return [];
    }

    // List of parents and their titles, for hashing purposes.
    parentTagTitleChain(): string[] {
        if (this.parent) {
            return [...this.parent.parentTagTitleChain(), `${this.parent.tag}:${this.parent.name}:${this.parent.titleText}`];
        }
        return [];
    }

    // Data used to compute a hash of the unit.
    hashData(): Record<string, string> {
        return {
            parent: this.parentTagTitleChain().join(','),
            numbering: this.numbering.join('.'),
            sourceNodeType: this.sourceNodeType,
            sourceNodeName: this.sourceNodeName,
            title: this.title ? this.title.map((n) => printRaw(n)).join('') : '',
            content: this.mainContent.map((n) => printRaw(n)).join('\n'),
        }
    }

    renderLinkTarget(renderer: (node: Node) => string) {
        this.linkTarget = {
            tag: this.tag,
            numberingText: this.numbering.join('.'),
            unitType: this.sourceNodeName,
            unitName: this.name,
            // HTML title, if it exists.
            titleHtml: this.title.length ? renderer({
                type: 'root',
                content: this.title
            }) : undefined
        };
    }

    renderBody(renderer: (node: Node) => string) {
        return renderer({
            type: 'root',
            content: wrapPars(this.mainContent),
        })
    }

    // Renders the IR unit as a unit data instance.
    renderToUnitData(allUnits: Map<number, IRUnit>, renderer: (node: Node) => string): UnitData {
        return AppDataSource.manager.create(UnitData, {
            tag: this.tag,
            hash: this.hash(),
            label: this.label ?? null,

            numberingText: this.numbering.join('.'),

            unitType: this.sourceNodeName,
            unitName: this.name,

            titleText: this.titleText,
            titleHTML: this.linkTarget?.titleHtml,
            contentHTML: this.renderBody(renderer),
            contentText: this.textContent,

            lastRendered: new Date(),

            parentChain: [...this.parentTagChain()].map((r) => allUnits.get(r)!.linkTarget!),

            directlyReferences: [...this.directReferences].map((r) => allUnits.get(r)!.linkTarget!),
            indirectlyReferences: this.indirectReferences ? [...this.indirectReferences].map((r) => allUnits.get(r)!.linkTarget!) : [],
            directlyReferencedBy: [...this.directlyReferencedBy].map((r) => allUnits.get(r)!.linkTarget!),
            indirectlyReferencedBy: [...this.indirectlyReferencedBy].map((r) => allUnits.get(r)!.linkTarget!),
        });
    }
}

