import {z} from "zod";


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
        font: z.enum(['roboto', 'open-sans', 'cmu-serif', 'cmu-sans-serif']).default('cmu-serif'),
        primaryColour: z.enum(['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky',
            'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']).default('blue'),
        neutralColour: z.enum(['slate', 'grey', 'zinc', 'stone']).default('grey'),
        searchLimit: z.int().min(1).default(16),
    }).prefault({})
});

export type SpecConfig = z.infer<typeof SpecConfigSchema>;

export const defaultConfig: SpecConfig = SpecConfigSchema.parse({});

export const defaultConfigPath = './spec.toml'

export let config: SpecConfig;

export function setConfig(newConfig: SpecConfig) {
    config = newConfig;
}
