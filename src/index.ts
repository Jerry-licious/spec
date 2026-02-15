import "./parser/loader"
import {Loader} from "./parser/loader";
import {parse} from "@unified-latex/unified-latex-util-parse";
import {BlockTypeCollector} from "./parser/block-type-collector";
import {MacroLabelCollector} from "./parser/macro-label-collector";


console.log('Happy developing ✨')


async function main() {
    const loader = new Loader();
    const root = await loader.process('./text.tex');
    const envCollector = new BlockTypeCollector();
    envCollector.process(root);
    const macroLabelCollector = new MacroLabelCollector([
        'part', 'chapter', 'section', 'subsection', 'subsubsection'
    ]);
    macroLabelCollector.process(root);

    console.log(loader.errors)
    console.log(envCollector.errors)
    console.log(macroLabelCollector.warnings)
    console.log(macroLabelCollector.witnessedLabels)
    console.log(root);
}

main().catch(console.error);


