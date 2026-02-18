import { z } from "zod";


export const ConfigSchema = z.object({
    database: z.string().default('stack.db'), // TODO: Rename after coming up with a name for the project.
    document: z.string().default('document.tex'),

    compileAll: z.boolean().default(false),
    redoTags: z.boolean().default(false),

    siteTitle: z.string().default('Unnamed Website'),

    indirectReferences: z.boolean().default(true),
});

// TODO: Rename config class after finding a name for the project.
export type Config = z.infer<typeof ConfigSchema>
