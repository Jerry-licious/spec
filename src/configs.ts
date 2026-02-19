import { z } from "zod";
import consola from "consola";
import {readFile, writeFile, access} from "node:fs/promises";
import {parse, stringify, TomlTable} from "smol-toml";


export const ConfigSchema = z.object({
    database: z.string().default('stack.db'), // TODO: Rename after coming up with a name for the project.
    document: z.string().default('document.tex'),

    compileAll: z.boolean().default(false),
    redoTags: z.boolean().default(false),

    siteTitle: z.string().default('Unnamed Website'),

    indirectReferences: z.boolean().default(true),
});

// TODO: Rename config class after finding a name for the project.
export type Config = z.infer<typeof ConfigSchema>;

export const defaultConfig: Config = ConfigSchema.parse({});

// TODO: YOu know the drill, need a name.
const defaultConfigPath = './stack.toml'



async function writeDefaultConfigs(configPath: string) {
    try {
        await writeFile(configPath, stringify(defaultConfig));
        consola.success(`Default configs have been saved at ${configPath}.`);
    } catch (error) {
        consola.error(`Failed to save default configs.`);
        consola.error(error);
    }
}


export async function loadConfig(configPath?: string): Promise<Config | void> {
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
        return ConfigSchema.parse(rawConfig);
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

