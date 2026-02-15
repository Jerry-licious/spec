import "./parser/loader"
import {Loader} from "./parser/loader";
import {parse} from "@unified-latex/unified-latex-util-parse";
import {BlockTypeCollector} from "./parser/block-type-collector";
import {MacroLabelAssigner} from "./parser/macro-label-assigner";
import {EnvironmentLabelAssigner} from "./parser/environment-label-assigner";


console.log('Happy developing ✨')


async function main() {
    const loader = new Loader();
    const root = await loader.process('./text.tex');

    const envCollector = new BlockTypeCollector();
    envCollector.process(root);

    const macroLabelCollector = new MacroLabelAssigner({
        labelRecipients: new Set<string>(['part', 'chapter', 'section', 'subsection', 'subsubsection']),
    });
    macroLabelCollector.process(root);

    const environmentLabelAssigner = new EnvironmentLabelAssigner({
        macroLabelRecipients: macroLabelCollector.labelRecipients,
        witnessedLabels: macroLabelCollector.witnessedLabels,
    });
    environmentLabelAssigner.process(root);

    console.log(loader.errors)
    console.log(envCollector.errors)
    console.log(macroLabelCollector.warnings)
    console.log(macroLabelCollector.witnessedLabels)
    console.log(environmentLabelAssigner.warnings)
    console.log(environmentLabelAssigner.witnessedLabels)
    console.log(root);
}

main().catch(console.error);


