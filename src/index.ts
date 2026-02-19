import "./compiler/loader"
import {Compiler} from "./compiler/compiler";
import {initialiseDatabase} from "./db";
import {loadConfig} from "./configs";
import consola from "consola";


console.log('Happy developing ✨')


async function main() {
    const config = await loadConfig();
    if (!config) {
        process.exit(0);
    }

    try {
        consola.start(`Initialising database from ${config.database}.`)
        await initialiseDatabase(config.database);
        consola.success(`Successfully initialised database.`);
    } catch (error) {
        consola.error('Failed to initialize database.');
        console.error(error);

        process.exit(1);
    }

    consola.start('Loading existing units from database.');

    const parser = new Compiler({
        config,
        unitLabelTags: new Map<string, number>(),
        bibliographyLabelTags: new Map<string, number>(),
        nextAvailableTag: 1,
        unitTagHash: new Map<number, string>()
    });

    const result = await parser.parseFile('./text.tex');
    console.log(result.unitsToUpdate);

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


