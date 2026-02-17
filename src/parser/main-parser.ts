// Orchestrates the full parsing process.
import {Configs} from "../configs";

export class MainParser {
    entry: string;
    redoTags: boolean;
    compileAll: boolean;

    // Mapping from unit labels to their tags.
    unitLabelTags: Map<string, number>;
    // Mapping from bibliography keys to tags.
    bibliographyLabelTags: Map<string, number>;
    nextAvailableTag: number;

    constructor({config, unitLabelTags, bibliographyLabelTags, nextAvailableTag}: {
        config: Configs;
        unitLabelTags: Map<string, number>;
        bibliographyLabelTags: Map<string, number>;
        nextAvailableTag?: number;
    }) {
        this.entry = config.entry;
        this.redoTags = config.redoTags;

        // If tags are getting recomputed, then everything needs to be recompiled anyway.
        this.compileAll = config.compileAll || config.redoTags;

        this.unitLabelTags = unitLabelTags;
        this.bibliographyLabelTags = bibliographyLabelTags;
        this.nextAvailableTag = nextAvailableTag ?? 1;
    }
}


