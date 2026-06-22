import {Node} from "@unified-latex/unified-latex-types";
import {printRaw} from "@unified-latex/unified-latex-util-print-raw";
import {createHash} from "crypto";
import {ReferenceCollector, TextCollector} from "../metadata";
import {AppDataSource} from "../../db";
import {wrapPars} from "@unified-latex/unified-latex-to-hast";
import {UnitData} from "../../db/unit-data";
import {LinkTarget} from "../../db/link-target";
import {macrosToOmit} from "../../unit-types";
import {match} from "@unified-latex/unified-latex-util-match";
import {visit} from "@unified-latex/unified-latex-util-visit";
import {FootnoteCollector} from "./footnote-collector";
import {RendererBuilder, RenderToHtml} from "../util";
import {FootnoteRefSubstitute} from "../renderer";

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
    directlyReferencedBy: Set<number> = new Set<number>();

    indirectReferences: Set<number> = new Set<number>();
    indirectlyReferencedBy: Set<number> = new Set<number>();

    computedHash?: string;

    // All the information needed to represent a link to this unit.
    linkTarget?: LinkTarget;
    lastModified?: Date;

    parasitic: boolean;
    isDivision: boolean;
    prefersLong: boolean;

    footnotes: Map<number, Node[]>;
    // Mapping from global footnote numbering to local footnote numbering.
    footnoteNumbers: Map<number, number>;

    constructor({parent, mainContent, sourceNodeType, sourceNodeName, name, label, title, tag, numbering,
                    parasitic, isDivision, additionalContent, prefersLong}: {
        parent?: IRUnit;
        mainContent?: Node[];

        // Used to collect information/visit stuff. Not rendered.
        additionalContent?: Node[];

        sourceNodeType: 'environment' | 'macro';
        sourceNodeName: string;
        name: string;
        label?: string;
        title?: Node[];
        tag: number;
        numbering?: number[];

        // A *parasitic* node is one that isn't "supposed" to live on its own page.
        parasitic: boolean;
        isDivision: boolean;

        // See LinkTarget.
        prefersLong?: boolean;
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

        this.parasitic = parasitic;
        this.isDivision = isDivision;
        this.prefersLong = !!prefersLong;

        this.titleText = this.title.map((n) => printRaw(n)).join('');

        // Collect relevant information.
        const allContent = [...this.title, ...this.mainContent, ...additionalContent ?? []];

        // Initialise the list of direct references here.
        const referenceCollector = new ReferenceCollector();
        for (const n of allContent) referenceCollector.process(n);
        this.directReferences = referenceCollector.referencedTags;

        const textCollector = new TextCollector({ macrosToOmit: macrosToOmit });
        for (const n of allContent) textCollector.process(n);
        this.textContent = textCollector.getCollectedText();

        const footnoteCollector = new FootnoteCollector();
        for (const n of allContent) footnoteCollector.process(n);
        this.footnotes = footnoteCollector.footnotes;

        this.footnoteNumbers = new Map<number, number>([...this.footnotes.keys()]
            .sort((a, b) => a - b).map((k, i) => [k, i + 1]));
    }

    buildRenderer(builder: RendererBuilder): RenderToHtml {
        return builder([
            // Plugins here
            new FootnoteRefSubstitute(this.footnoteNumbers).asPlugin()
        ]);
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

    async renderLinkTarget(builder: RendererBuilder) {
        if (this.linkTarget) return;

        this.linkTarget = {
            tag: this.tag,
            numberingText: this.numbering.join('.'),
            unitType: this.sourceNodeName,
            unitName: this.name,
            // HTML title, if it exists.
            titleHtml: this.title.length ? await this.buildRenderer(builder)({
                type: 'root',
                content: this.title
            }) : undefined,
            prefersLong: this.prefersLong,
        };
    }

    async renderBody(builder: RendererBuilder): Promise<string> {
        return await this.buildRenderer(builder)({
            type: 'root',
            content: wrapPars(this.mainContent),
        })
    }

    async renderFootnotes(builder: RendererBuilder): Promise<Record<number, string>> {
        const renderer = this.buildRenderer(builder);

        return Object.fromEntries(await Promise.all([...this.footnotes.entries()].sort(([a], [b]) => a - b)
            .map(async ([k, v]): Promise<[number, string]> => [k, await renderer({ type: 'root', content: v })])));
    }

    // Renders the IR unit as a unit data instance.
    async renderToUnitData(allUnits: Map<number, IRUnit>, builder: RendererBuilder): Promise<UnitData> {
        // In conservative mode, the all units pool is unavailable.
        // For simplicity, these errors will be ignored.
        function getLinkTarget(r: number) {
            if (allUnits.has(r)) return [allUnits.get(r)!.linkTarget!];
            return [];
        }

        return AppDataSource.manager.create(UnitData, {
            tag: this.tag,
            hash: this.hash(),
            label: this.label ?? null,

            numberingText: this.numbering.join('.'),

            unitType: this.sourceNodeName,
            unitName: this.name,

            titleText: this.titleText,
            titleHTML: this.linkTarget?.titleHtml,
            contentHTML: await this.renderBody(builder),
            contentText: this.textContent,
            footnotes: await this.renderFootnotes(builder),

            lastRendered: new Date(),
            lastModified: this.lastModified ?? new Date(),

            parentChain: [...this.parentTagChain()].map((r) => allUnits.get(r)!.linkTarget!),

            directlyReferences: [...this.directReferences].flatMap(getLinkTarget),
            indirectlyReferences: this.indirectReferences ? [...this.indirectReferences].flatMap(getLinkTarget) : [],
            directlyReferencedBy: [...this.directlyReferencedBy].flatMap(getLinkTarget),
            indirectlyReferencedBy: [...this.indirectlyReferencedBy].flatMap(getLinkTarget),

            parasitic: this.parasitic,
            isDivision: this.isDivision,
            prefersLong: this.prefersLong,
        });
    }

    // Assigns the current IR node as the parent of all environments in the given node.
    assignAsParent(node: Node) {
        visit(node, (child) => {
            if (!match.anyEnvironment(child)) return;

            child.meta = {
                ...child.meta, parentIRUnit: this
            };
        })
    }
}

