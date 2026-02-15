import "./parser/loader"
import {Loader} from "./parser/loader";
import {parse} from "@unified-latex/unified-latex-util-parse";
import {BlockTypeCollector} from "./parser/block-type-collector";
import {MacroLabelAssigner} from "./parser/macro-label-assigner";
import {EnvironmentLabelAssigner} from "./parser/environment-label-assigner";
import {EquationLabelAssigner} from "./parser/equation-label-assigner";
import {TagAssigner} from "./parser/tag-assigner";
import {Numberer} from "./parser/numberer";
import {capitaliseFirstLetter, documentDividers} from "./parser/util";
import {CountManager} from "./parser/counter";
import * as util from "node:util";
import {TheoremTitleAssigner} from "./parser/theorem-title-assigner";
import {TheoremProofAssigner} from "./parser/theorem-proof-assigner";
import {RefAssigner} from "./parser/ref-assigner";


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

    const refAssigner = new RefAssigner({
        tagNodeMap: tagAssigner.tagNodeMap,
        labelTagMap: tagAssigner.labelTagMap,
        macroNames: new Map<string, string>([...documentDividers].map((d) => [d, capitaliseFirstLetter(d)])),
        environmentNames: new Map<string, string>([...envCollector.blockTypes.entries()].map(([k, v]) => [k, v.name]))
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

    console.log(loader.errors)
    console.log(envCollector.errors)
    console.log(macroLabelCollector.warnings)
    console.log(macroLabelCollector.witnessedLabels)
    console.log(environmentLabelAssigner.warnings)
    console.log(environmentLabelAssigner.witnessedLabels)
    console.log(tagAssigner.tagNodeMap)
    console.log(tagAssigner.labelTagMap)
    console.log(util.inspect(root, { depth: 4 }));
}

main().catch(console.error);


