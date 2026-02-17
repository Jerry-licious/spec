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
import {unified} from "unified";
import {RefRenderer} from "./parser/renderer/ref-renderer";
import {MathRenderer} from "./parser/renderer/math-renderer";
import {NodeRenderer} from "./parser/renderer/renderer";
import {BlockRenderer} from "./parser/renderer/block-renderer";
import {ProofRenderer} from "./parser/renderer/proof-renderer";
import {unifiedLatexToHast} from "@unified-latex/unified-latex-to-hast";
import rehypeStringify from "rehype-stringify";
import {OmitMacro} from "./parser/renderer/omit";
import {BibliographyLoader} from "./parser/bib-loader";
import {CiteAssigner} from "./parser/metadata/cite-assigner";
import {CiteRenderer} from "./parser/renderer/cite-renderer";
import {MainCollector} from "./parser/grouping/main-collector";
import {MainParser} from "./parser/main-parser";


console.log('Happy developing ✨')


async function main() {
    const parser = new MainParser({
        config: {
            // Path to the SQLite file.
            sqlite: '',
            // The main document file.
            entry: './text.tex',
            // Whether to compile every unit without checking for hash/changes.
            compileAll: true,
            // Whether to ERASE THE EXISTING DATABASE and compute tags from scratch.
            redoTags: true,
            // Title of the main page and the website.
            siteTitle: 'Math notes'
        },

        unitLabelTags: new Map<string, number>(),
        bibliographyLabelTags: new Map<string, number>(),
        nextAvailableTag: 1,
    });

    await parser.parseFile('./text.tex')

    /*
    const renderer = unified()
        .use(new OmitMacro({
            toOmit: new Set([
                'label', 'newcommand', 'renewcommand', 'newtheorem', 'bibliographystyle', 'bibliography'
            ])
        }).asPlugin())
        .use(new MathRenderer().asPlugin())
        .use(new RefRenderer().asPlugin())
        .use(new CiteRenderer().asPlugin())
        .use(new BlockRenderer({ blockNames }).asPlugin())
        .use(new ProofRenderer().asPlugin())
        .use(unifiedLatexToHast as any)
        .use(rehypeStringify);

    const node = renderer.runSync(root);
    console.log(renderer.stringify(node as any));
    */
}

main().catch(console.error);


