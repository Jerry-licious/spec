import "./compiler/loader"
import {Compiler} from "./compiler/compiler";
import {AppDataSource, initialiseDatabase} from "./db";
import consola from "consola";
import {In} from "typeorm";
import {loadConfig} from "~/load-configs";
import {UnitData} from "~/db/unit-data";
import {BibliographyData} from "~/db/bib-data";


async function main() {
    const config = await loadConfig();
    if (!config) {
        process.exit(0);
    }
    
    await initialiseDatabase(config.database);

    const unitRepository = AppDataSource.getRepository(UnitData);
    const bibliographyRepository = AppDataSource.getRepository(BibliographyData);

    let existingUnits: UnitData[] = [];
    let existingBibliography: BibliographyData[] = [];
    if (config.compiler.redoTags) {
        consola.info('Deleting all existing units from the database.');
        try {
            await unitRepository.deleteAll();
            await bibliographyRepository.deleteAll();
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
            existingBibliography = await bibliographyRepository.find({
                select: { tag: true, key: true },
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
    const bibliographyLabelTags = new Map<string, number>(existingBibliography.map((u) => [u.key, u.tag]));

    const nextAvailableTag = 1 + Math.max(0,
        ...existingUnits.map((u) => u.tag),
        ...existingBibliography.map((u) => u.tag)
    );

    const parser = new Compiler({
        config,
        unitLabelTags,
        bibliographyLabelTags,
        nextAvailableTag,
        unitTagHash
    });

    const result = await parser.parseFile(config.document);

    try {
        consola.info(`Inserting/updating ${result.unitsToUpdate.length} units into the database.`);
        // On conflict, update all non-primary columns.
        const primaryColumns = unitRepository.metadata.columns
            .filter((c) => c.isPrimary).map((c) => c.databaseName);

        await unitRepository.upsert(result.unitsToUpdate, primaryColumns);

        consola.info(`Deleting ${result.unitsToDelete.length} units from the database.`);

        await unitRepository.delete({
            tag: In(result.unitsToDelete)
        });

        consola.info(`Inserting ${result.bibliography.length} bibliography entries.`)

        // Units should just be refreshed every time.
        await bibliographyRepository.deleteAll();
        await bibliographyRepository.insert(result.bibliography);

        consola.info('(Re)building the search index.')

        // SQLite supports fts5: https://sqlite.org/fts5.html
        await AppDataSource.query(`
        CREATE VIRTUAL TABLE IF NOT EXISTS units_fts 
        USING fts5(contentText, content='units', content_rowid='tag');
        `);
        await AppDataSource.query(`
        INSERT INTO units_fts(units_fts) VALUES('rebuild');
        `);

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


