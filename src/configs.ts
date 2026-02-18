// TODO: Rename this class after this project gets a real name.
export interface Configs {
    // Path to the SQLite file.
    sqlite: string;
    // The main document file.
    entry: string;
    // Whether to compile every unit without checking for hash/changes.
    compileAll: boolean;
    // Whether to ERASE THE EXISTING DATABASE and compute tags from scratch.
    redoTags: boolean;

    // Title of the main page and the website.
    siteTitle: string;

    indirectReferences: boolean;
}