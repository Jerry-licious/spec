export interface NodeContext {
    readonly filePath: string;
    readonly line: number;
    readonly column: number;
    readonly content: string;
}

export interface ParsingMessage {
    readonly location?: NodeContext;
    readonly message: string;
}
