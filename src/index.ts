import "./parser/loader"
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
            siteTitle: 'Math notes',
            indirectReferences: true,
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


