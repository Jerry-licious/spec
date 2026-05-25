import "./compiler/loader"
import {Compiler} from "./compiler/compiler";
import {AppDataSource, initialiseDatabase} from "./db";
import consola from "consola";
import {In} from "typeorm";
import {loadConfig} from "./load-config";
import {toLinkTarget, UnitData} from "./db/unit-data";
import {BibliographyData} from "./db/bib-data";
import {AuxData} from "./db/aux-data";
import {GraphicData} from "./db/graphic-data";
import {defaultConfigPath} from "./config";
import {LinkInfo} from "./db/link-target";


export interface CompilerOptionOverride {
    compileAll?: boolean;
    conservative?: boolean;
    targetFile?: string;
    // Whether to load link data from the database to supplement link-related information.
    loadExistingUnits?: boolean;
}


export async function getCompiler({compileAll, conservative, targetFile, loadExistingUnits}: CompilerOptionOverride, log: boolean, fillDefaultConfig: boolean) {
    let config = await loadConfig(defaultConfigPath, fillDefaultConfig);
    if (!config) {
        process.exit(0);
    }

    compileAll = !!compileAll;

    config.compiler.compileAll = config.compiler.compileAll || compileAll;
    // Compile all will disable conservative mode.
    conservative = conservative && !compileAll;

    await initialiseDatabase(config.database);

    const unitRepository = AppDataSource.getRepository(UnitData);
    const bibliographyRepository = AppDataSource.getRepository(BibliographyData);
    const graphicsDataRepository = AppDataSource.getRepository(GraphicData);

    let existingUnits: UnitData[] = [];
    let existingBibliography: BibliographyData[] = [];
    let existingGraphics: GraphicData[] = [];
    let rawEnvironments: string = '';

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
            existingUnits = await unitRepository.find();
            existingBibliography = await bibliographyRepository.find({
                select: { tag: true, key: true },
            });
            existingGraphics = await graphicsDataRepository.find({
                select: { path: true, hash: true },
            });
            rawEnvironments = await AppDataSource.getRepository(AuxData)
                .findOneBy({ key: 'environments' }).then((e) => e?.value ?? '')
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
    const unitTagLastModified = new Map<number, Date>(existingUnits.map((u) => [u.tag, u.lastModified]));
    const unitLabelLink = new Map<string, LinkInfo>(existingUnits.filter((u) => u.label)
        .map((u) => [u.label!, toLinkTarget(u)]))

    const bibliographyLabelTags = new Map<string, number>(existingBibliography.map((u) => [u.key, u.tag]));

    const graphicPathHash = new Map<string, string>(existingGraphics.map((g) => [g.path, g.hash]))

    const nextAvailableTag = 1 + Math.max(0,
        ...existingUnits.map((u) => u.tag),
        ...existingBibliography.map((u) => u.tag)
    );

    return new Compiler({
        config, unitLabelTags, bibliographyLabelTags, nextAvailableTag, unitTagHash,
        unitTagLastModified, graphicPathHash, conservative, rawEnvironments,
        unitLabelLink: loadExistingUnits ? unitLabelLink : undefined,
    });
}

export async function runCompiler({compileAll, conservative, targetFile}: CompilerOptionOverride ) {
    const compiler = await getCompiler({compileAll, conservative, targetFile}, true, false);
    const config = await loadConfig(defaultConfigPath);
    if (!config) {
        process.exit(0);
    }

    conservative = conservative && !compileAll;

    const unitRepository = AppDataSource.getRepository(UnitData);
    const bibliographyRepository = AppDataSource.getRepository(BibliographyData);
    const graphicsDataRepository = AppDataSource.getRepository(GraphicData);

    const result = await compiler.compileFile(targetFile ?? config.document);

    try {
        const upsertBatchSize = 500;

        consola.info(`Inserting/updating ${result.unitsToUpdate.length} units into the database.`);
        // On conflict, update all non-primary columns.
        const primaryColumns = unitRepository.metadata.columns
            .filter((c) => c.isPrimary).map((c) => c.databaseName);

        for (let i = 0; i < result.unitsToUpdate.length; i += upsertBatchSize) {
            await unitRepository.upsert(result.unitsToUpdate.slice(i, i + upsertBatchSize), primaryColumns);
        }

        // Only delete old units outside of conservative mode.
        if (!conservative) {
            consola.info(`Deleting ${result.unitsToDelete.length} units from the database.`);

            await unitRepository.delete({
                tag: In(result.unitsToDelete)
            });
        }

        consola.info(`Inserting ${result.bibliography.length} bibliography entries.`)

        // Units should just be refreshed every time.
        await bibliographyRepository.deleteAll();
        for (let i = 0; i < result.bibliography.length; i += upsertBatchSize) {
            await bibliographyRepository.insert(result.bibliography.slice(i, i + upsertBatchSize));
        }

        consola.info('(Re)building the search index.')

        // SQLite supports fts5: https://sqlite.org/fts5.html
        await AppDataSource.query(`
        CREATE VIRTUAL TABLE IF NOT EXISTS units_fts 
        USING fts5(contentText, content='units', content_rowid='tag');
        `);
        await AppDataSource.query(`
        INSERT INTO units_fts(units_fts) VALUES('rebuild');
        `);

        consola.info(`Updating ${result.graphicsToUpdate.length} graphics entries.`);
        for (let i = 0; i < result.graphicsToUpdate.length; i += upsertBatchSize) {
            await graphicsDataRepository.upsert(result.graphicsToUpdate.slice(i, i + upsertBatchSize), ['path']);
        }
        // Only delete old units outside of conservative mode.
        if (!conservative) {
            consola.info(`Deleting ${result.graphicsToDelete.length} graphics entries from the database.`);

            await graphicsDataRepository.delete({
                path: In(result.graphicsToDelete)
            });
        }

        if (!conservative) {
            consola.info('Updating the project preamble.');
            await AppDataSource.getRepository(AuxData).upsert({
                key: 'preamble', value: result.preamble,
            }, ['key']);
            await AppDataSource.getRepository(AuxData).upsert({
                key: 'environments', value: result.rawEnvironments
            }, ['key']);
        }

        consola.success(`Successfully updated the database.`);
    } catch (error) {
        consola.error('Failed to update the database.');
        console.error(error);

        process.exit(42);
    }
}

//runCompiler({compileAll: true}).catch(console.error);


