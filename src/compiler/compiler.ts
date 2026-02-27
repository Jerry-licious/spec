// Orchestrates the full parsing process.
import {SpecConfig} from "../config";
import {ParserLogger} from "./logging-base";
import consola from "consola";
import {messageText} from "./error";
import {BibliographyLoader} from "./bib-loader";
import {Loader} from "./loader";
import {Environment, Macro, Node, Root} from "@unified-latex/unified-latex-types";
import {CountManager} from "./counter";
import {capitaliseFirstLetter} from "./util";
import {BibtexEntry} from "@orcid/bibtex-parse-js";
import {BlockCollector, BlockEnv, Division, DivisionCollector, IRUnit, MainCollector} from "./grouping";
import {
    BlockType,
    BlockTypeCollector,
    CiteAssigner,
    CustomMacroCollector,
    EnvironmentLabelAssigner,
    EquationLabelAssigner,
    MacroLabelAssigner,
    Numberer,
    RefAssigner,
    TagAssigner,
    TheoremProofAssigner,
    TheoremTitleAssigner
} from "./metadata";
import {unified} from "unified";
import {
    BlockRenderer,
    CiteRenderer,
    EmptyParagraphFilter,
    MathRenderer,
    OmitMacro,
    ProofRenderer,
    RefRenderer, UnitTitleRenderer
} from "./renderer";
import {unifiedLatexToHast} from "@unified-latex/unified-latex-to-hast";
import rehypeStringify from "rehype-stringify";
import {documentDividers, macrosToOmit} from "../unit-types";
import {UnitData} from "../db/unit-data";
import {BibliographyData} from "../db/bib-data";


const divisionMarkers = new Set<string>(documentDividers);


interface CompileResult {
    // A list of new or updated unit data.
    unitsToUpdate: UnitData[];
    // Tags to be deleted.
    unitsToDelete: number[];

    // Bibliography seems so minuscule, so surely I do not need to avoid the writes.
    bibliography: BibliographyData[];

    // Preamble string for mathjax.
    preamble: string;
}


export class Compiler {
    entry: string;
    title: string;
    compileAll: boolean;
    indirectReferences: boolean;

    // Mapping from unit labels to their tags.
    unitLabelTags: Map<string, number>;
    // Hash of the existing units.
    unitTagHash: Map<number, string>;
    // Mapping from unit tags to their nodes.
    unitTagNode: Map<number, Macro | Environment>;

    // Mapping from bibliography keys to tags.
    bibliographyKeyTags: Map<string, number>;
    bibliographyEntries: Map<string, BibtexEntry>;
    bibliographyData: BibliographyData[];

    nextAvailableTag: number;

    logger: ParserLogger;

    documentRoot?: Root;

    countManager: CountManager;
    blockTypes: Map<string, BlockType>;
    rawMacros: Map<string, string>;

    units: Map<number, IRUnit>;
    divisions: Map<number, Division>;
    blocks: Map<number, BlockEnv>;

    renderToHTML: (node: Node) => string;

    constructor({config, unitLabelTags, bibliographyLabelTags, nextAvailableTag, unitTagHash}: {
        config: SpecConfig;
        unitLabelTags: Map<string, number>;
        bibliographyLabelTags: Map<string, number>;
        nextAvailableTag: number;
        unitTagHash: Map<number, string>;
    }) {
        this.entry = config.document;
        this.compileAll = config.compiler.compileAll;
        this.title = config.siteTitle;
        this.indirectReferences = config.compiler.indirectReferences;

        this.unitLabelTags = unitLabelTags;
        this.unitTagHash = unitTagHash;
        this.unitTagNode = new Map<number, Macro | Environment>();

        this.bibliographyKeyTags = bibliographyLabelTags;
        this.bibliographyEntries = new Map<string, BibtexEntry>();
        this.bibliographyData = [];

        this.nextAvailableTag = nextAvailableTag;

        this.countManager = new CountManager();
        this.blockTypes = new Map<string, BlockType>();
        this.rawMacros = new Map<string, string>();

        this.units = new Map<number, IRUnit>();
        this.divisions = new Map<number, Division>();
        this.blocks = new Map<number, BlockEnv>();

        this.renderToHTML = () => { throw new Error('The renderer is not yet created.') };

        this.logger = new ParserLogger({
            onError: message => {
                consola.info(messageText(message));
            },
            onSuccess: message => {
                consola.success(messageText(message));
            },
            onWarning: message => {
                consola.warn(messageText(message));
            },
            onInfo: message => {
                consola.info(messageText(message));
            }
        });
    }

    async parseFile(file: string): Promise<CompileResult> {
        consola.start(`Starting the compiler on ${file}.`);

        await this.collectContent(file);

        this.collectDefinitions();

        this.assignLabels();
        this.assignTags();
        this.numberUnits();

        this.assignLinks();
        this.assignBlockMetadata();

        this.collectUnits();
        this.computeUnitReferences();

        const result = {
            ...this.renderUnits(),
            bibliography: this.bibliographyData,
            preamble: [...this.rawMacros.values()].join('\n')
        };

        const messageContent = `Finished compiling with ${this.logger.numErrors} errors and ${this.logger.numWarnings} warnings.`
        if (this.logger.numErrors > 0) {
            this.logger.error(messageContent);
        } else {
            this.logger.success(messageContent);
        }

        return result;
    }


    renderUnits() {
        const renderingLogger = new ParserLogger({ parent: this.logger });
        renderingLogger.info('Creating HTML renderer. ');

        const renderer = unified()
            .use(new OmitMacro({
                toOmit: macrosToOmit
            }).asPlugin())
            .use(new MathRenderer({ logger: renderingLogger }).asPlugin())
            .use(new UnitTitleRenderer({ logger: renderingLogger }).asPlugin())
            .use(new RefRenderer({ logger: renderingLogger }).asPlugin())
            .use(new CiteRenderer({ logger: renderingLogger }).asPlugin())
            .use(new BlockRenderer({
                blockNames: new Map<string, string>([...this.blockTypes.entries()].map(([k, v]) => [k, v.name])),
                logger: renderingLogger
            }).asPlugin())
            .use(new ProofRenderer({ logger: renderingLogger }).asPlugin())
            .use(unifiedLatexToHast as any)
            .use(new EmptyParagraphFilter({ logger: renderingLogger }).asPlugin())
            .use(rehypeStringify);

        this.renderToHTML = (node: Node) => {
            return renderer.stringify(renderer.runSync(node) as any);
        }

        renderingLogger.success('Renderer has been created.');

        renderingLogger.info('Rendering units.');

        this.renderUnitLinkTargets();

        const toUpdate = this.renderUnitData();
        const toDelete = [...this.unitTagHash.keys()].filter((t) => !this.units.has(t));

        const messageContent = `Rendered ${toUpdate.length} units (skipped ${this.units.size - toUpdate.length}) with ${renderingLogger.numErrors} errors and ${renderingLogger.numWarnings} warnings.`
        if (renderingLogger.numErrors > 0) {
            this.logger.error(messageContent);
        } else {
            this.logger.success(messageContent);
        }

        return { unitsToUpdate: toUpdate, unitsToDelete: toDelete };
    }

    renderUnitData() {
        const toUpdate: UnitData[] = [];
        for (const unit of this.units.values()) {
            // Skip any node with the same hash as the stored.
            if (!this.compileAll && this.unitTagHash.has(unit.tag) && unit.hash() === this.unitTagHash.get(unit.tag)) continue;

            toUpdate.push(unit.renderToUnitData(this.units, this.renderToHTML));
        }

        return toUpdate;
    }

    renderUnitLinkTargets() {
        for (const unit of this.units.values()) {
            unit.renderLinkTarget(this.renderToHTML);
        }
    }

    collectUnits() {
        this.collectDivisions();
        this.collectBlocks();

        this.units = new Map<number, IRUnit>([
            ...Array.from(this.divisions.entries()),
            ...Array.from(this.blocks.entries()),
        ]);
    }

    computeUnitReferences() {
        this.logger.info('Computing unit references.');

        this.computeReverseDirectReferences();

        if (this.indirectReferences) {
            this.computeIndirectReferences();
            this.computeReverseIndirectReferences();
        }

        this.logger.success('Computed all unit references.');
    }

    computeReverseDirectReferences() {
        for (const unit of this.units.values()) {
            for (const ref of unit.directReferences) {
                if (this.units.has(ref)) {
                    this.units.get(ref)!.directlyReferencedBy.add(unit.tag);
                }
            }
        }
    }

    computeIndirectReferences() {
        // This will be done using a basic graph traversal, because I haven't found a more efficient way yet.
        // However, the fact that the blocks are obtained in sequential order means that the blocks should be
        // """almost in topological order""". So in practice, this shouldn't be O(|V|^2).

        for (const unit of this.units.values()) {
            const visited = new Set<number>([unit.tag]);
            const queue: IRUnit[] = [unit];

            while (queue.length > 0) {
                const current = queue.shift()!;
                for (const ref of current.directReferences) {
                    if (visited.has(ref) || !this.units.has(ref)) continue;

                    visited.add(ref);

                    const refUnit = this.units.get(ref)!;
                    // If the references have already been figured out, then there is no need to visit it again.
                    if (refUnit.indirectReferences) {
                        refUnit.indirectReferences.forEach((r) => visited.add(r));
                    } else {
                        queue.push(this.units.get(ref)!);
                    }
                }
            }

            // Remove itself from the list if present.
            visited.delete(unit.tag);
            // Indirect references are "strict". Direct references are not to be included.
            unit.directReferences.forEach((ref) => visited.delete(ref));

            unit.indirectReferences = visited;
        }
    }

    computeReverseIndirectReferences() {
        for (const unit of this.units.values()) {
            for (const ref of unit.indirectReferences!) {
                if (this.units.has(ref)) {
                    this.units.get(ref)!.indirectlyReferencedBy.add(unit.tag);
                }
            }
        }
    }

    async collectContent(file: string) {
        const loadingLogger = new ParserLogger({ parent: this.logger });
        loadingLogger.info('Starting to load files.');

        const loader = new Loader({ logger: loadingLogger });
        this.documentRoot = await loader.process(file);

        const bibliographyLoader = new BibliographyLoader({
            nextAvailableTag: this.nextAvailableTag,
            keyTagMap: this.bibliographyKeyTags,
            logger: loadingLogger
        });
        bibliographyLoader.process(this.documentRoot);
        this.bibliographyEntries = bibliographyLoader.bibliographyEntries;
        this.bibliographyData = bibliographyLoader.getBibliographyData();

        this.nextAvailableTag = bibliographyLoader.nextAvailableTag;

        const messageContent = `File content and bibliography have been loaded with ${loadingLogger.numErrors} errors and ${loadingLogger.numWarnings} warnings.`;
        if (loadingLogger.numErrors > 0) {
            this.logger.error(messageContent);
        } else {
            this.logger.success(messageContent);
        }
    }


    // Collects custom user macros and custom environments.
    collectDefinitions() {
        const definitionLogger = new ParserLogger({ parent: this.logger });
        definitionLogger.info('Collecting custom macros and environments.');

        const envCollector = new BlockTypeCollector({ countManager: this.countManager, logger: definitionLogger });
        envCollector.process(this.documentRoot!);
        this.blockTypes = envCollector.blockTypes;

        const macroCollector = new CustomMacroCollector({ logger: definitionLogger });
        macroCollector.process(this.documentRoot!);
        this.rawMacros = macroCollector.rawMacros;

        const messageContent = `Collected ${this.blockTypes.size} custom environment types and ${macroCollector.rawMacros.size} custom macros with ${definitionLogger.numErrors} errors and ${definitionLogger.numWarnings} warnings.`;
        if (definitionLogger.numErrors > 0) {
            this.logger.error(messageContent);
        } else {
            this.logger.success(messageContent);
        }
    }

    assignLabels() {
        const labelLogger = new ParserLogger({ parent: this.logger });
        labelLogger.info('Assigning labels to divisions, blocks, and equations.');

        const macroLabelCollector = new MacroLabelAssigner({
            labelRecipients: new Set<string>(documentDividers), logger: labelLogger,
        });
        macroLabelCollector.process(this.documentRoot!);

        const environmentLabelAssigner = new EnvironmentLabelAssigner({
            macroLabelRecipients: macroLabelCollector.labelRecipients,
            witnessedLabels: macroLabelCollector.witnessedLabels,
            whiteList: new Set<string>(this.blockTypes.keys()),
            logger: labelLogger
        });
        environmentLabelAssigner.process(this.documentRoot!);

        const equationLabelAssigner = new EquationLabelAssigner({
            witnessedLabels: environmentLabelAssigner.witnessedLabels,
            logger: labelLogger,
        });
        equationLabelAssigner.process(this.documentRoot!);

        const messageContent = `Finished assigning labels to divisions, blocks, and equations with ${labelLogger.numErrors} errors and ${labelLogger.numWarnings} warnings.`;
        if (labelLogger.numErrors > 0) {
            this.logger.error(messageContent);
        } else {
            this.logger.success(messageContent);
        }
    }

    assignTags() {
        const tagLogger = new ParserLogger({ parent: this.logger });
        tagLogger.info('Assigning tags to divisions and blocks.');

        const tagAssigner = new TagAssigner({
            taggableEnvironments: new Set<string>(this.blockTypes.keys()),
            taggableMacros: new Set<string>(documentDividers),
            labelTagMap: this.unitLabelTags,
            nextAvailableTag: this.nextAvailableTag,
            logger: tagLogger,
        });
        tagAssigner.process(this.documentRoot!);
        this.nextAvailableTag = tagAssigner.nextAvailableTag;
        this.unitTagNode = tagAssigner.tagNodeMap;

        const messageContent = `Finished assigning ${this.unitTagNode.size} tags to divisions and blocks with ${tagLogger.numErrors} errors and ${tagLogger.numWarnings} warnings.`;
        if (tagLogger.numErrors > 0) {
            this.logger.error(messageContent);
        } else {
            this.logger.success(messageContent);
        }
    }

    numberUnits() {
        const numberLogger = new ParserLogger({ parent: this.logger });
        numberLogger.info('Assigning numbers to divisions and blocks.');

        const numberer = new Numberer({
            countManager: this.countManager, logger: numberLogger,
            environmentCounters: new Map<string, string>(
                [...this.blockTypes.entries()].map(([k, v]) => [k, v.associatedCounter]))
        });
        numberer.process(this.documentRoot!);

        const messageContent = `Finished assigning numbers to divisions and blocks with ${numberLogger.numErrors} errors and ${numberLogger.numWarnings} warnings.`;
        if (numberLogger.numErrors > 0) {
            this.logger.error(messageContent);
        } else {
            this.logger.success(messageContent);
        }
    }

    assignLinks() {
        const linkLogger = new ParserLogger({ parent: this.logger });
        linkLogger.info('Assigning link metadata to \\ref and \\cite commands.');

        const refAssigner = new RefAssigner({
            tagNodeMap: this.unitTagNode,
            labelTagMap: this.unitLabelTags,
            macroNames: new Map<string, string>([...documentDividers].map((d) => [d, capitaliseFirstLetter(d)])),
            environmentNames: new Map<string, string>([...this.blockTypes.entries()].map(([k, v]) => [k, v.name])),
            logger: linkLogger
        });
        refAssigner.process(this.documentRoot!);

        const citeAssigner = new CiteAssigner({
            bibliographyEntries: this.bibliographyEntries,
            logger: this.logger
        });
        citeAssigner.process(this.documentRoot!);

        const messageContent = `Finished assigning link metadata to \\ref and \\cite commands with ${linkLogger.numErrors} errors and ${linkLogger.numWarnings} warnings.`;
        if (linkLogger.numErrors > 0) {
            this.logger.error(messageContent);
        } else {
            this.logger.success(messageContent);
        }
    }

    assignBlockMetadata() {
        const blockLogger = new ParserLogger({ parent: this.logger });
        blockLogger.info('Assigning metadata to block environments.');

        const titleAssigner = new TheoremTitleAssigner({
            theorems: new Set<string>(this.blockTypes.keys()),
            logger: blockLogger
        });
        titleAssigner.process(this.documentRoot!);

        const proofAssigner = new TheoremProofAssigner({
            theorems: new Set<string>(this.blockTypes.keys()),
            logger: blockLogger
        });
        proofAssigner.process(this.documentRoot!);

        const messageContent = `Finished assigning metadata to block environments with ${blockLogger.numErrors} errors and ${blockLogger.numWarnings} warnings.`;
        if (blockLogger.numErrors > 0) {
            this.logger.error(messageContent);
        } else {
            this.logger.success(messageContent);
        }
    }

    collectDivisions() {
        const divisionLogger = new ParserLogger({ parent: this.logger });
        divisionLogger.info('Collecting divisions.');

        const subsubsectionCollector = new DivisionCollector({
            divisionMarkers, targetDivisionMarker: 'subsubsection', divisionName: 'Subsubsection',
            childDivisions: new Set<string>(), descendantDivisions: new Set<string>(), existingDivisions: this.divisions,
            logger: divisionLogger
        });
        subsubsectionCollector.process(this.documentRoot!);

        const subsectionCollector = new DivisionCollector({
            divisionMarkers, targetDivisionMarker: 'subsection', divisionName: 'Subsection',
            childDivisions: new Set<string>(['subsubsection']),
            descendantDivisions: new Set<string>(['subsubsection']), existingDivisions: this.divisions,
            logger: divisionLogger
        });
        subsectionCollector.process(this.documentRoot!);

        const sectionCollector = new DivisionCollector({
            divisionMarkers, targetDivisionMarker: 'section', divisionName: 'Section',
            childDivisions: new Set<string>(['subsection']),
            descendantDivisions: new Set<string>(['subsection', 'subsubsection']), existingDivisions: this.divisions,
            logger: divisionLogger
        });
        sectionCollector.process(this.documentRoot!);

        const chapterCollector = new DivisionCollector({
            divisionMarkers, targetDivisionMarker: 'chapter', divisionName: 'Chapter',
            childDivisions: new Set<string>(['section']),
            descendantDivisions: new Set<string>(['section', 'subsection', 'subsubsection']), existingDivisions: this.divisions,
            logger: divisionLogger
        });
        chapterCollector.process(this.documentRoot!);

        const partCollector = new DivisionCollector({
            divisionMarkers, targetDivisionMarker: 'part', divisionName: 'Part',
            childDivisions: new Set<string>(['chapter']),
            descendantDivisions: new Set<string>(['chapter', 'section', 'subsection', 'subsubsection']), existingDivisions: this.divisions,
            logger: divisionLogger
        });
        partCollector.process(this.documentRoot!);

        const mainCollector = new MainCollector({
            existingDivisions: this.divisions, title: this.title,
            logger: divisionLogger
        });
        mainCollector.process(this.documentRoot!);

        const messageContent = `Collected ${this.divisions.size} divisions with ${divisionLogger.numErrors} errors and ${divisionLogger.numWarnings} warnings.`;
        if (divisionLogger.numErrors > 0) {
            this.logger.error(messageContent);
        } else {
            this.logger.success(messageContent);
        }
    }

    collectBlocks() {
        const blockLogger = new ParserLogger({ parent: this.logger });
        blockLogger.info('Collecting block environments.');

        const blockCollector = new BlockCollector({
            blockNames: new Map<string, string>([...this.blockTypes.entries()].map(([k, v]) => [k, v.name])),
            divisionMarkers, existingDivisions: this.divisions, logger: blockLogger });
        blockCollector.process(this.documentRoot!);
        this.blocks = blockCollector.blocks;

        const messageContent = `Collected ${this.blocks.size} block environments with ${blockLogger.numErrors} errors and ${blockLogger.numWarnings} warnings.`;
        if (blockLogger.numErrors > 0) {
            this.logger.error(messageContent);
        } else {
            this.logger.success(messageContent);
        }
    }
}


