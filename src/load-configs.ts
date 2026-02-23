'use server';

import consola from "consola";
import {access, readFile, writeFile} from "node:fs/promises";
import {config, defaultConfig, defaultConfigPath, setConfig, SpecConfig, SpecConfigSchema} from "~/configs";
import {parse, stringify, TomlTable} from "smol-toml";


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
        setConfig(SpecConfigSchema.parse(rawConfig));
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


async function writeDefaultConfigs(configPath: string) {
    try {
        await writeFile(configPath, stringify(defaultConfig));
        consola.success(`Default configs have been saved at ${configPath}.`);
    } catch (error) {
        consola.error(`Failed to save default configs.`);
        consola.error(error);
    }
}