import "./compiler/loader"
import {Compiler} from "./compiler/compiler";
import {AppDataSource, initialiseDatabase, UnitData} from "./db";
import {loadConfig} from "./configs";
import consola from "consola";
import {In} from "typeorm";


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

        process.exit(41);
    }

    const unitRepository = AppDataSource.getRepository(UnitData);

    let existingUnits: UnitData[] = [];
    if (config.redoTags || config.compileAll) {
        consola.info('Deleting all existing units from the database.');
        try {
            await unitRepository.deleteAll();
        } catch (e) {
            consola.error('Failed to delete units from the database.');
            console.error(e);
            process.exit(42);
        }
        consola.success(`Successfully deleted all existing units from the database.`);
    } else {
        consola.info('Loading units from the database.');
        try {
            existingUnits = await unitRepository.find({
                select: { tag: true, label: true, hash: true },
            });
        } catch (e) {
            consola.error('Failed to load existing units from the database.');
            console.error(e);
            process.exit(43);
        }
        consola.success(`Loaded ${existingUnits.length} units from the database.`);
    }

    const unitLabelTags = new Map<string, number>(existingUnits.filter((u) => u.label)
        .map((u) => [u.label!, u.tag]));
    const unitTagHash = new Map<number, string>(existingUnits.map((u) => [u.tag, u.hash]));

    // TODO: Bibliography situation
    const nextAvailableTag = Math.max(0, ...existingUnits.map((u) => u.tag)) + 1;

    const parser = new Compiler({
        config,
        unitLabelTags,
        bibliographyLabelTags: new Map<string, number>(),
        nextAvailableTag,
        unitTagHash
    });

    const result = await parser.parseFile(config.document);

    try {
        consola.info(`Inserting/updating ${result.unitsToUpdate.length} entries into the database.`);
        // On conflict, update all non-primary columns.
        const primaryColumns = unitRepository.metadata.columns
            .filter((c) => c.isPrimary).map((c) => c.databaseName);

        await unitRepository.upsert(result.unitsToUpdate, primaryColumns);

        consola.info(`Deleting ${result.unitsToDelete.length} entries from the database.`);

        await unitRepository.delete({
            tag: In(result.unitsToDelete)
        });

        consola.success(`Successfully updated the database.`);
    } catch (error) {
        consola.error('Failed to update the database.');
        console.error(error);

        process.exit(42);
    }

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


