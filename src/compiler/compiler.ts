// Orchestrates the full parsing process.
import * as fs from "fs/promises"
import * as crypto from "crypto"
import {SpecConfig} from "../config";
import {ParserLogger} from "./logging-base";
import consola from "consola";
import {messageText} from "./error";
import {BibliographyLoader} from "./bib-loader";
import {Loader} from "./loader";
import {Node, Root} from "@unified-latex/unified-latex-types";
import {CountManager} from "./counter";
import {capitaliseFirstLetter, graphicsRoot, Parser, RendererBuilder, TaggableNode} from "./util";
import {BibtexEntry} from "@orcid/bibtex-parse-js";
import {
    BlockCollector,
    BlockEnv,
    Division,
    DivisionCollector,
    Figure,
    FigureCollector,
    IRUnit,
    LabeledEquation,
    LabeledEquationCollector,
    MainCollector
} from "./grouping";
import {
    BlockType,
    BlockTypeCollector,
    CiteAssigner,
    CustomMacroCollector,
    EnvironmentLabelAssigner,
    EquationLabelAssigner,
    FigureCaptionNumberer,
    GraphicsPathAssigner, LinkInfoCollector,
    MacroLabelAssigner,
    Numberer,
    RefAssigner,
    TagAssigner,
    TheoremProofAssigner,
    TheoremTitleAssigner
} from "./metadata";
import {Pluggable, Processor, unified} from "unified";
import {
    BlockRenderer,
    CiteRenderer,
    EmptyParagraphFilter,
    EnumerateRenderer,
    FigureCaptionRenderer,
    FigureRenderer,
    FootnoteRefRenderer,
    GraphicsRenderer,
    HLineRenderer,
    ItemNumberer,
    MathRenderer,
    OmitMacro,
    ProofRenderer,
    RefRenderer,
    UnitTitleRenderer
} from "./renderer";
import {unifiedLatexToHast} from "@unified-latex/unified-latex-to-hast";
import rehypeStringify from "rehype-stringify";
import {documentDividers, macrosToOmit} from "../unit-types";
import {UnitData} from "../db/unit-data";
import {BibliographyData} from "../db/bib-data";
import {TikzExtractor} from "./renderer/tikz-extractor";
import {ItemParagraphBreaker} from "./renderer/item-paragraph-breaker";
import path from "node:path";
import {Sema} from "async-sema";
import {GraphicData} from "../db/graphic-data";
import {AppDataSource} from "../db";
import {getParser, parse} from "@unified-latex/unified-latex-util-parse";
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import {LinkInfo} from "../db/link-target";
import { environmentInfo } from "@unified-latex/unified-latex-ctan";


const divisionMarkers = new Set<string>(documentDividers);

// Apparently, simply allowing * to have className isn't enough.
// Certain element types whitelist style classes, which must be overwritten.
const sanetiseSchema = {
    ...defaultSchema,
    attributes: {
        ...Object.fromEntries(Object.entries(defaultSchema.attributes ?? {})
            .map(([tag, defs]) => [
                tag, defs.map(def =>
                    Array.isArray(def) && def[0] === 'className' ? 'className' : def
                ),
            ])
        ),
        '*': [...(defaultSchema.attributes?.['*'] ?? []), 'className'],
    },
};


interface CompileResult {
    // A list of new or updated unit data.
    unitsToUpdate: UnitData[];
    // Tags to be deleted.
    unitsToDelete: number[];

    graphicsToUpdate: GraphicData[];
    graphicsToDelete: string[];

    // Bibliography seems so minuscule, so surely I do not need to avoid the writes.
    bibliography: BibliographyData[];

    // Preamble string for mathjax.
    preamble: string;

    // Raw dump of all \newtheorem macros used to define environments.
    rawEnvironments: string;
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
    unitTagLastModified: Map<number, Date>;
    // Mapping from unit tags to their nodes.
    unitTagNode: Map<number, TaggableNode>;
    unitLabelLink?: Map<string, LinkInfo>;

    // Hash of the existing figures.
    graphicPathHash: Map<string, string>;

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
    // Raw dump of all \newtheorem macros used to define environments.
    rawEnvironments: string;

    units: Map<number, IRUnit>;
    divisions: Map<number, Division>;
    blocks: Map<number, BlockEnv>;
    equations: Map<number, LabeledEquation>;
    figures: Map<number, Figure>;

    baseRenderer?: Processor;
    rendererBuilder: RendererBuilder;

    conservative: boolean;

    constructor({config, unitLabelTags, bibliographyLabelTags, nextAvailableTag, unitTagHash, graphicPathHash,
                    conservative, unitLabelLink, rawEnvironments, unitTagLastModified}: {
        config: SpecConfig;
        unitLabelTags: Map<string, number>;
        bibliographyLabelTags: Map<string, number>;
        nextAvailableTag: number;
        unitTagHash: Map<number, string>;
        unitTagLastModified: Map<number, Date>;
        graphicPathHash: Map<string, string>;
        conservative?: boolean;
        unitLabelLink?: Map<string, LinkInfo>;
        rawEnvironments?: string;
    }) {
        this.entry = config.document;
        this.compileAll = config.compiler.compileAll;
        this.title = config.siteTitle;
        this.indirectReferences = config.compiler.indirectReferences;

        this.unitLabelTags = unitLabelTags;
        this.unitTagHash = unitTagHash;
        this.unitTagLastModified = unitTagLastModified;
        this.graphicPathHash = graphicPathHash;
        this.unitLabelLink = unitLabelLink;
        this.unitTagNode = new Map<number, TaggableNode>();

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
        this.equations = new Map<number, LabeledEquation>();
        this.figures = new Map<number, Figure>();

        this.rendererBuilder = () => { throw new Error('The renderer is not yet created.') };

        this.conservative = conservative ?? false;

        this.rawEnvironments = rawEnvironments ?? '';

        this.logger = new ParserLogger({
            onError: message => { consola.error(messageText(message)); },
            onSuccess: message => { consola.success(messageText(message)); },
            onWarning: message => { consola.warn(messageText(message)); },
            onInfo: message => { consola.info(messageText(message)); }
        });
    }

    // Custom environments will always come with an optional title argument:
    // \begin{custom}[Title]
    // This brings in a problem: I need to parse the code to figure out what the custom environments are.
    // But if I don't know what the custom environments are, then the parser will not capture the argument
    // as part of the environment.
    // The solution: during a parsing process, collect the code responsible for generating the environments
    // and store them in the database. In future passes, as long as the code didn't change, I will be able to
    // structure my block types using the stored code.
    // In the event that these do change, I will unfortunately have to restart the compiler **in its entirety**.
    // It is quite expensive, but I doubt anyone does this often.
    setupEnvironments() {
        const definitionLogger = new ParserLogger({ parent: this.logger });
        definitionLogger.info('Setting up custom environment parsing from stored preamble.');

        const envCollector = new BlockTypeCollector({ countManager: this.countManager, logger: definitionLogger });
        envCollector.process(parse(this.rawEnvironments));

        this.blockTypes = envCollector.blockTypes;

        definitionLogger.report(`Loaded ${this.blockTypes.size} custom environment types.`);
    }

    // Here is where I handle the optional arguments for each custom environment.
    getParser(): Parser {
        const existingEnvironments = new Set<string>(Object.values(environmentInfo).flatMap(Object.keys));

        return getParser({
            environments: {
                ...Object.fromEntries(this.blockTypes.keys().filter((t) => !existingEnvironments.has(t))
                    .map((t) => [t, { signature: 'o' }])),
            }
        });
    }

    // Returns false if the parsing process needs to restart.
    processTree(): boolean {
        if (!this.collectDefinitions()) {
            return false;
        }

        this.assignLabelsAndNumbers();
        this.assignTags();

        this.adjustEnumerates();

        this.assignLinks();
        this.assignBlockMetadata();

        this.collectUnits();
        this.computeUnitReferences();

        this.createRenderer();

        return true;
    }

    async compileFile(file: string): Promise<CompileResult> {
        consola.start(`Starting the compiler on ${file}.`);

        // Use the predefined macros to anticipate custom environments.
        this.setupEnvironments();

        await this.collectContent(file);

        // processTree returns false if restart is required.
        if (!this.processTree()) {
            return await this.compileFile(file);
        }

        const result = {
            ...await this.copyGraphics(),
            ...await this.renderUnits(),
            bibliography: this.bibliographyData,
            preamble: [...this.rawMacros.values()].join('\n'),
            rawEnvironments: this.rawEnvironments
        };

        this.logger.report("Finished compiling the project.");

        return result;
    }

    async compileText(text: string): Promise<string> {
        this.setupEnvironments();

        this.documentRoot = this.getParser().parse(text);

        this.processTree();

        return await this.rendererBuilder([[rehypeSanitize, sanetiseSchema]])(this.documentRoot);
    }


    assignLabelsAndNumbers() {
        const numberLogger = new ParserLogger({ parent: this.logger });
        numberLogger.info('Assigning labels and numbers to divisions and blocks.');

        // The situation here is as follows: labels are fully optional for equations in that very little is gained by
        // an equation having a label when this label is not used.
        // However, since only equations with labels are numbered, they must come first.

        const equationLabelAssigner = new EquationLabelAssigner({
            logger: numberLogger,
        });
        equationLabelAssigner.process(this.documentRoot!);

        const environmentCounters = new Map<string, string>([...this.blockTypes.entries()]
            .map(([k, v]) => [k, v.associatedCounter]));
        environmentCounters.set("figure", "figure");

        const numberer = new Numberer({
            countManager: this.countManager, logger: numberLogger, environmentCounters
        });
        numberer.process(this.documentRoot!);

        // Following this, macros and environments gain a persistent tag by having a label, which allows
        // reloads to be less tedious during writing sessions.
        // As such, it is beneficial to automatically generate one if it is not present.
        // While there are more advanced methods of creating persistent labels. I believe that
        // the numbering and environment/macro type are sufficient to serve as a basic anchor,
        // which is why the numberer comes before the macro and environment label assigners.

        const macroLabelCollector = new MacroLabelAssigner({
            labelRecipients: new Set<string>(documentDividers), logger: numberLogger,
            witnessedLabels: equationLabelAssigner.witnessedLabels,
        });
        macroLabelCollector.process(this.documentRoot!);

        const environmentLabelWhitelist = new Set<string>(this.blockTypes.keys());
        // Also allow figures to receive labels.
        environmentLabelWhitelist.add("figure");

        const environmentLabelAssigner = new EnvironmentLabelAssigner({
            macroLabelRecipients: macroLabelCollector.labelRecipients,
            witnessedLabels: macroLabelCollector.witnessedLabels,
            whiteList: environmentLabelWhitelist,
            logger: numberLogger
        });
        environmentLabelAssigner.process(this.documentRoot!);

        numberLogger.report("Finished assigning labels and numbers to divisions and blocks.");
    }

    async copyGraphics() {
        const graphicLogger = new ParserLogger({ parent: this.logger });
        graphicLogger.info('Copying referenced graphics to the public folder.');

        const graphicCollector = new GraphicsPathAssigner();
        graphicCollector.process(this.documentRoot!);

        const witnessedPaths = graphicCollector.witnessedPaths;
        const totalWitnessedPaths = witnessedPaths.size;
        const graphicsToUpdate: GraphicData[] = [];

        // Use a semaphore so I don't load up someone's entire hard drive in memory.
        const copySema = new Sema(10);

        await Promise.all([...witnessedPaths.values()].map(async (graphicPath) => {
            let buffer: Buffer;

            await copySema.acquire();

            try {
                buffer = await fs.readFile(graphicPath);
            } catch (e) {
                graphicLogger.error(`Failed to read ${graphicPath}.`);

                // Failing to read the file should constitute removing it from the witness collection.
                // I think the collection is copied when using map, so this shouldn't cause a problem.
                witnessedPaths.delete(graphicPath);

                copySema.release();
                return;
            }

            const hash = crypto.createHash('sha256').update(buffer).digest('hex');

            // Skip copying the graphic if the hash already matches up.
            if (!this.compileAll && this.graphicPathHash.has(graphicPath) && this.graphicPathHash.get(graphicPath) === hash) return;

            try {
                const targetLocation = path.join(graphicsRoot, graphicPath);

                await fs.mkdir(path.dirname(targetLocation), { recursive: true });
                await fs.writeFile(targetLocation, buffer);
            } catch (e) {
                graphicLogger.error(`Failed to copy ${graphicPath}.`);
                copySema.release();
                return;
            }

            copySema.release();
            graphicsToUpdate.push(AppDataSource.manager.create(GraphicData, ({
                path: graphicPath, hash, lastCopied: new Date()
            })));
        }));

        const graphicsToDelete = [...this.graphicPathHash.keys()].filter((t) => !witnessedPaths.has(t));

        await Promise.all(graphicsToDelete.map(async (graphicPath) => {
            try {
                await fs.unlink(path.join(graphicsRoot, graphicPath));
            } catch (e) {
                graphicLogger.error(`Failed to unlink ${graphicPath}.`);
            }
        }));

        graphicLogger.report(`Copied ${graphicsToUpdate.length} graphics files (skipped ${totalWitnessedPaths - graphicsToUpdate.length}).`)

        return {
            graphicsToUpdate: graphicsToUpdate,
            graphicsToDelete
        };
    }

    createRenderer() {
        const renderingLogger = new ParserLogger({ parent: this.logger });
        renderingLogger.info('Creating HTML renderer. ');

        this.baseRenderer = unified()
            // The enumerate renderer may expose nodes in labels, which is why it should come first.
            .use(new EnumerateRenderer({}).asPlugin())
            .use(new OmitMacro({
                toOmit: macrosToOmit
            }).asPlugin())
            .use(new FootnoteRefRenderer({}).asPlugin())
            .use(new MathRenderer({
                logger: renderingLogger,
                preambleDump: [...this.rawMacros.values()].join('\n'),
                refRenderer: new RefRenderer({ tagUnitMap: this.units, logger: renderingLogger, inMathMode: true })
            }).asPlugin())
            .use(new FigureCaptionRenderer({ logger: renderingLogger }).asPlugin())
            .use(new GraphicsRenderer({ logger: renderingLogger }).asPlugin())
            .use(new FigureRenderer({ logger: renderingLogger }).asPlugin())
            .use(new UnitTitleRenderer({ logger: renderingLogger }).asPlugin())
            .use(new RefRenderer({ tagUnitMap: this.units, logger: renderingLogger }).asPlugin())
            .use(new CiteRenderer({ logger: renderingLogger }).asPlugin())
            .use(new BlockRenderer({
                blockNames: new Map<string, string>([...this.blockTypes.entries()].map(([k, v]) => [k, v.name])),
                logger: renderingLogger
            }).asPlugin())
            .use(new ProofRenderer({ logger: renderingLogger }).asPlugin())
            .use(unifiedLatexToHast as any)
            .use(new EmptyParagraphFilter({ logger: renderingLogger }).asPlugin())
            .use(new TikzExtractor({ logger: renderingLogger }).asPlugin())
            .use(new HLineRenderer({ logger: renderingLogger }).asPlugin())
            .freeze();
        //.use(rehypeStringify, { allowDangerousHtml: true });

        this.rendererBuilder = (plugins: Pluggable[]) => {
            const renderer = this.baseRenderer!().use(plugins)
                .use(rehypeStringify, { allowDangerousHtml: true });

            return async (node: Node) => renderer.stringify(await renderer.run(node) as any);
        }

        renderingLogger.report('Renderer has been created.');
    }


    async renderUnits() {
        const renderingLogger = new ParserLogger({ parent: this.logger });
        renderingLogger.info('Rendering units.');

        await this.renderUnitLinkTargets();

        const toUpdate = await this.renderUnitData();
        const toDelete = [...this.unitTagHash.keys()].filter((t) => !this.units.has(t));

        renderingLogger.report(`Rendered ${toUpdate.length} units (skipped ${this.units.size - toUpdate.length}).`);

        return { unitsToUpdate: toUpdate, unitsToDelete: toDelete };
    }

    async renderUnitData() {
        const toUpdate: UnitData[] = [];
        for (const unit of this.units.values()) {
            // Skip any node with the same hash as the stored.
            if (this.unitTagHash.has(unit.tag) && this.unitTagLastModified.has(unit.tag) && unit.hash() === this.unitTagHash.get(unit.tag)) {
                unit.lastModified = this.unitTagLastModified.get(unit.tag);
                if (!this.compileAll) continue;
            }

            toUpdate.push(await unit.renderToUnitData(this.units, this.rendererBuilder));
        }

        return toUpdate;
    }

    async renderUnitLinkTargets() {
        for (const unit of this.units.values()) {
            await unit.renderLinkTarget(this.rendererBuilder);
        }
    }

    collectUnits() {
        this.collectDivisions();
        this.collectBlocks();
        this.collectParasiticEnvironments();

        this.units = new Map<number, IRUnit>([
            ...Array.from(this.divisions.entries()),
            ...Array.from(this.blocks.entries()),
            ...Array.from(this.equations.entries()),
            ...Array.from(this.figures.entries())
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
                        for (const r of refUnit.indirectReferences) {
                            visited.add(r);
                        }
                    } else {
                        queue.push(this.units.get(ref)!);
                    }
                }
            }

            // Remove itself from the list if present.
            visited.delete(unit.tag);

            // Indirect references are "strict". Direct references are not to be included.
            for (const ref of unit.directReferences) {
                visited.delete(ref)
            }

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

        const loader = new Loader({ logger: loadingLogger, parser: this.getParser() });
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

        loadingLogger.report("File content and bibliography have been loaded");
    }


    // Collects custom user macros and custom environments.
    // Returns false if a "restart" is required.
    collectDefinitions(): boolean {
        const definitionLogger = new ParserLogger({ parent: this.logger });
        definitionLogger.info('Collecting custom macros and environments.');

        const envCollector = new BlockTypeCollector({ countManager: new CountManager(), logger: definitionLogger });
        // There are more advanced ways of detecting changes in custom macros and environments, but the simplest way to
        // do so is by the source code. While this produces false positives for restarts, it is not too heavy a cost
        // to bear.
        envCollector.process(this.documentRoot!);

        // If there is a mismatch, update the definitions and reset the parsing system.
        if (envCollector.blockTypeDefinitions.join('\n') !== this.rawEnvironments) {
            this.rawEnvironments = envCollector.blockTypeDefinitions.join('\n');
            this.countManager = new CountManager();

            definitionLogger.info("Detected changes in custom environments, restarting the parser.");
            return false;
        }

        const macroCollector = new CustomMacroCollector({ logger: definitionLogger });
        macroCollector.process(this.documentRoot!);
        this.rawMacros = macroCollector.rawMacros;

        definitionLogger.report(`Collected ${this.blockTypes.size} custom environment types and ${macroCollector.rawMacros.size} custom macros.`);

        return true;
    }

    assignTags() {
        const tagLogger = new ParserLogger({ parent: this.logger });
        tagLogger.info('Assigning tags to divisions and blocks.');

        const taggableEnvironments = new Set<string>(this.blockTypes.keys());
        taggableEnvironments.add('figure');
        const tagAssigner = new TagAssigner({
            taggableEnvironments: taggableEnvironments,
            taggableMacros: new Set<string>(documentDividers),
            labelTagMap: this.unitLabelTags,
            nextAvailableTag: this.nextAvailableTag,
            logger: tagLogger,
        });
        tagAssigner.process(this.documentRoot!);
        this.nextAvailableTag = tagAssigner.nextAvailableTag;
        this.unitTagNode = tagAssigner.tagNodeMap;


        // Propagate number and tag information down to captions.
        const captionNumberer = new FigureCaptionNumberer({logger: tagLogger});
        captionNumberer.process(this.documentRoot!);

        tagLogger.report(`Finished assigning ${this.unitTagNode.size} tags to divisions and blocks.`);
    }

    adjustEnumerates() {
        const numberLogger = new ParserLogger({ parent: this.logger });
        numberLogger.info('Adjusting the rendering of enumerate items.');

        const numberer = new ItemNumberer({ logger: numberLogger });
        numberer.process(this.documentRoot!);

        const breaker = new ItemParagraphBreaker({ logger: numberLogger });
        breaker.process(this.documentRoot!);

        numberLogger.report("Finished adjusting enumerate items.");
    }

    assignLinks() {
        const linkLogger = new ParserLogger({ parent: this.logger });
        linkLogger.info('Assigning link metadata to \\ref and \\cite commands.');

        const environmentNames = new Map<string, string>([...this.blockTypes.entries()].map(([k, v]) => [k, v.name]));
        environmentNames.set('figure', 'Figure');

        const macroNames = new Map<string, string>([...documentDividers].map((d) => [d, capitaliseFirstLetter(d)]));

        // If label -> link info map is provided, then use that as the source.
        // Otherwise, collect it manually.
        if (!this.unitLabelLink) {
            const linkCollector = new LinkInfoCollector({
                logger: linkLogger,
                macroNames,
                environmentNames,
            });
            linkCollector.process(this.documentRoot!);
            this.unitLabelLink = linkCollector.unitLabelLink;
        }


        const refAssigner = new RefAssigner({
            logger: linkLogger,
            unitLabelLink: this.unitLabelLink
        });
        refAssigner.process(this.documentRoot!);

        const citeAssigner = new CiteAssigner({
            bibliographyEntries: this.bibliographyEntries,
            logger: this.logger
        });
        citeAssigner.process(this.documentRoot!);

        linkLogger.report("Finished assigning link metadata to \\ref and \\cite commands.");
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

        blockLogger.report("Finished assigning metadata to block environments.");
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

        // Do not overwrite the main page in conservative mode.
        if (!this.conservative) {
            const mainCollector = new MainCollector({
                existingDivisions: this.divisions, title: this.title,
                logger: divisionLogger
            });
            mainCollector.process(this.documentRoot!);
        }

        divisionLogger.report(`Collected ${this.divisions.size} divisions.`);
    }

    collectBlocks() {
        const blockLogger = new ParserLogger({ parent: this.logger });
        blockLogger.info('Collecting block environments.');

        const blockCollector = new BlockCollector({
            blockNames: new Map<string, string>([...this.blockTypes.entries()].map(([k, v]) => [k, v.name])),
            divisionMarkers, existingDivisions: this.divisions, logger: blockLogger });
        blockCollector.process(this.documentRoot!);
        this.blocks = blockCollector.blocks;

        blockLogger.report(`Collected ${this.blocks.size} block environments.`);
    }

    collectParasiticEnvironments() {
        const parasiticLogger = new ParserLogger({ parent: this.logger });
        parasiticLogger.info('Collecting parasitic environments.');

        const blockCollector = new LabeledEquationCollector({ logger: parasiticLogger });
        blockCollector.process(this.documentRoot!);
        this.equations = blockCollector.equations;

        const figureCollector = new FigureCollector({ logger: parasiticLogger });
        figureCollector.process(this.documentRoot!);
        this.figures = figureCollector.figures;

        parasiticLogger.report(`Collected ${this.equations.size} parasitic environments.`);
    }
}


