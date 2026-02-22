import { z } from "zod";
import consola from "consola";
import {readFile, writeFile, access} from "node:fs/promises";
import {parse, stringify, TomlTable} from "smol-toml";


export const SpecConfigSchema = z.object({
    database: z.string().default('spec.db'),
    document: z.string().default('document.tex'),
    siteTitle: z.string().default('Unnamed Website'),

    compiler: z.object({
        compileAll: z.boolean().default(false),
        redoTags: z.boolean().default(false),

        indirectReferences: z.boolean().default(true),
    }).prefault({}),

    website: z.object({
        font: z.enum(['roboto', 'open-sans', 'cmu-serif', 'cmu-sans-serif']).default('cmu-serif')
    }).prefault({})
});

export type SpecConfig = z.infer<typeof SpecConfigSchema>;

export const defaultConfig: SpecConfig = SpecConfigSchema.parse({});

const defaultConfigPath = './spec.toml'


async function writeDefaultConfigs(configPath: string) {
    try {
        await writeFile(configPath, stringify(defaultConfig));
        consola.success(`Default configs have been saved at ${configPath}.`);
    } catch (error) {
        consola.error(`Failed to save default configs.`);
        consola.error(error);
    }
}


export let config: SpecConfig = defaultConfig;

export async function loadConfig(configPath?: string): Promise<SpecConfig | void> {
    configPath = configPath ?? defaultConfigPath;

    consola.start(`Loading configs from ${configPath}.`);
    try {
        await access(configPath);
    } catch (error) {
        consola.info(`Failed to access config. Using default configs. `);
        await writeDefaultConfigs(configPath);

        return defaultConfig;
    }

    let rawConfig: TomlTable;
    try {
        rawConfig = parse(await readFile(configPath, { encoding: 'utf-8' }));
        config = SpecConfigSchema.parse(rawConfig);
        return config;
    } catch (error) {
        consola.error(`Failed to parse config.`);
        consola.error(error);

        if (!await consola.prompt('Continue with default configs?', {
            type: 'confirm',
        })) return;

        if (await consola.prompt('Overwrite existing config with default config?', { type: 'confirm' })) {
            await writeDefaultConfigs(configPath);
        }

        return defaultConfig;
    }
}

