import "./parser/loader"
import {Loader} from "./parser/loader";
import {parse} from "@unified-latex/unified-latex-util-parse";
import {BlockTypeCollector} from "./parser/metadata/block-type-collector";
import {MacroLabelAssigner} from "./parser/metadata/macro-label-assigner";
import {EnvironmentLabelAssigner} from "./parser/metadata/environment-label-assigner";
import {EquationLabelAssigner} from "./parser/metadata/equation-label-assigner";
import {TagAssigner} from "./parser/metadata/tag-assigner";
import {Numberer} from "./parser/metadata/numberer";
import {capitaliseFirstLetter, documentDividers} from "./parser/util";
import {CountManager} from "./parser/counter";
import * as util from "node:util";
import {TheoremTitleAssigner} from "./parser/metadata/theorem-title-assigner";
import {TheoremProofAssigner} from "./parser/metadata/theorem-proof-assigner";
import {RefAssigner} from "./parser/metadata/ref-assigner";
import {BlockCollector} from "./parser/grouping/block-collector";
import {DivisionCollector} from "./parser/grouping/division-collector";
import {Division} from "./parser/grouping/division";


console.log('Happy developing ✨')


async function main() {
    const loader = new Loader();

    const root = await loader.process('./text.tex');

    const countManager = new CountManager();

    const envCollector = new BlockTypeCollector({countManager});
    envCollector.process(root);

    const macroLabelCollector = new MacroLabelAssigner({
        labelRecipients: new Set<string>(documentDividers),
    });
    macroLabelCollector.process(root);

    const environmentLabelAssigner = new EnvironmentLabelAssigner({
        macroLabelRecipients: macroLabelCollector.labelRecipients,
        witnessedLabels: macroLabelCollector.witnessedLabels,
    });
    environmentLabelAssigner.process(root)

    const equationLabelAssigner = new EquationLabelAssigner({
        witnessedLabels: environmentLabelAssigner.witnessedLabels
    });
    equationLabelAssigner.process(root);

    const tagAssigner = new TagAssigner({
        taggableEnvironments: new Set<string>(envCollector.blockTypes.keys()),
        taggableMacros: new Set<string>(documentDividers)
    });
    tagAssigner.process(root);

    const numberer = new Numberer({
        countManager,
        environmentCounters: new Map<string, string>([...envCollector.blockTypes.entries()].map(([k, v]) => [k, v.associatedCounter]))
    });
    numberer.process(root);

    const blockNames = new Map<string, string>([...envCollector.blockTypes.entries()].map(([k, v]) => [k, v.name]));
    const refAssigner = new RefAssigner({
        tagNodeMap: tagAssigner.tagNodeMap,
        labelTagMap: tagAssigner.labelTagMap,
        macroNames: new Map<string, string>([...documentDividers].map((d) => [d, capitaliseFirstLetter(d)])),
        environmentNames: blockNames
    });
    refAssigner.process(root);

    const titleAssigner = new TheoremTitleAssigner({
        theorems: new Set<string>(envCollector.blockTypes.keys()),
    });
    titleAssigner.process(root);

    const proofAssigner = new TheoremProofAssigner({
        theorems: new Set<string>(envCollector.blockTypes.keys()),
    });
    proofAssigner.process(root);

    // Metadata collection is over. Time to collect the pages.

    const divisionMarkers = new Set<string>(documentDividers);
    const existingDivisions = new Map<number, Division>();

    const subsubsectionCollector = new DivisionCollector({
        divisionMarkers, targetDivisionMarker: 'subsubsection', divisionName: 'Subsubsection',
        childDivisions: new Set<string>(), existingDivisions
    });
    subsubsectionCollector.process(root);

    const subsectionCollector = new DivisionCollector({
        divisionMarkers, targetDivisionMarker: 'subsection', divisionName: 'Subsection',
        childDivisions: new Set<string>(['subsubsection']), existingDivisions
    });
    subsectionCollector.process(root);

    const sectionCollector = new DivisionCollector({
        divisionMarkers, targetDivisionMarker: 'section', divisionName: 'Section',
        childDivisions: new Set<string>(['subsection']), existingDivisions
    });
    sectionCollector.process(root);

    const chapterCollector = new DivisionCollector({
        divisionMarkers, targetDivisionMarker: 'chapter', divisionName: 'Chapter',
        childDivisions: new Set<string>(['section']), existingDivisions
    });
    chapterCollector.process(root);

    const partCollector = new DivisionCollector({
        divisionMarkers, targetDivisionMarker: 'part', divisionName: 'Part',
        childDivisions: new Set<string>(['chapter']), existingDivisions
    });
    partCollector.process(root);

    console.log(util.inspect(existingDivisions, { depth: 4 }));


    const blockCollector = new BlockCollector({ blockNames });
    blockCollector.process(root);
    console.log(blockCollector.blocks);

    console.log(util.inspect(root, { depth: 4 }));
}

main().catch(console.error);


