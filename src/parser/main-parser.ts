// Orchestrates the full parsing process.
import {Configs} from "../configs";
import {ParserLogger} from "./logging-base";
import consola from "consola";
import {messageText} from "./error";
import {BibliographyLoader} from "./bib-loader";
import {Loader} from "./loader";
import {Environment, Macro, Node, Root} from "@unified-latex/unified-latex-types";
import {BlockTypeCollector} from "./metadata/block-type-collector";
import {CountManager} from "./counter";
import {CustomMacroCollector} from "./metadata/custom-macro-collector";
import {BlockType} from "./metadata/block-type";
import {MacroLabelAssigner} from "./metadata/macro-label-assigner";
import {capitaliseFirstLetter, documentDividers} from "./util";
import {EnvironmentLabelAssigner} from "./metadata/environment-label-assigner";
import {EquationLabelAssigner} from "./metadata/equation-label-assigner";
import {TagAssigner} from "./metadata/tag-assigner";
import {Numberer} from "./metadata/numberer";
import {RefAssigner} from "./metadata/ref-assigner";
import {CiteAssigner} from "./metadata/cite-assigner";
import {BibtexEntry} from "@orcid/bibtex-parse-js";
import {TheoremTitleAssigner} from "./metadata/theorem-title-assigner";
import {TheoremProofAssigner} from "./metadata/theorem-proof-assigner";
import {Division} from "./grouping/division";
import {DivisionCollector} from "./grouping/division-collector";
import {MainCollector} from "./grouping/main-collector";
import {BlockEnv} from "./grouping/block";
import {BlockCollector} from "./grouping/block-collector";


const divisionMarkers = new Set<string>(documentDividers);


export class MainParser {
    entry: string;
    title: string;
    redoTags: boolean;
    compileAll: boolean;

    // Mapping from unit labels to their tags.
    unitLabelTags: Map<string, number>;
    // Mapping from unit tags to their nodes.
    unitTagNode: Map<number, Macro | Environment>;

    // Mapping from bibliography keys to tags.
    bibliographyKeyTags: Map<string, number>;
    bibliographyEntries: Map<string, BibtexEntry>;
    
    nextAvailableTag: number;

    logger: ParserLogger;

    documentRoot?: Root;

    countManager: CountManager;
    blockTypes: Map<string, BlockType>;
    rawMacros: Map<string, string>;
    
    divisions: Map<number, Division>;
    blocks: Map<number, BlockEnv>;
    
    constructor({config, unitLabelTags, bibliographyLabelTags, nextAvailableTag}: {
        config: Configs;
        unitLabelTags: Map<string, number>;
        bibliographyLabelTags: Map<string, number>;
        nextAvailableTag: number;
    }) {
        this.entry = config.entry;
        this.redoTags = config.redoTags;
        this.title = config.siteTitle;

        // If tags are getting recomputed, then everything needs to be recompiled anyway.
        this.compileAll = config.compileAll || config.redoTags;

        this.unitLabelTags = unitLabelTags;
        this.unitTagNode = new Map<number, Macro | Environment>();
        
        this.bibliographyKeyTags = bibliographyLabelTags;
        this.bibliographyEntries = new Map<string, BibtexEntry>();
        
        this.nextAvailableTag = nextAvailableTag;

        this.countManager = new CountManager();
        this.blockTypes = new Map<string, BlockType>();
        this.rawMacros = new Map<string, string>();
        
        this.divisions = new Map<number, Division>();
        this.blocks = new Map<number, BlockEnv>();

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

    async parseFile(file: string) {
        consola.start('Starting the parser.');

        await this.collectContent(file);
        
        this.collectDefinitions();
        
        this.assignLabels();
        this.assignTags();
        this.numberUnits();
        
        this.assignLinks();
        this.assignBlockMetadata();

        this.collectDivisions();
        this.collectBlocks();
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

        const messageContent = `Collected ${this.blockTypes.size} custom environment types and ${macroCollector.rawMacros} custom macros with ${definitionLogger.numErrors} errors and ${definitionLogger.numWarnings} warnings.`;
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
        
        const blockNames = new Map<string, string>([...this.blockTypes.entries()].map(([k, v]) => [k, v.name]));
        const refAssigner = new RefAssigner({
            tagNodeMap: this.unitTagNode,
            labelTagMap: this.unitLabelTags,
            macroNames: new Map<string, string>([...documentDividers].map((d) => [d, capitaliseFirstLetter(d)])),
            environmentNames: blockNames,
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


