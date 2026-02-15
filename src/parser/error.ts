export interface NodeContext {
    readonly filePath: string;
    readonly line: number;
    readonly column: number;
    readonly content: string;
}

export interface ParsingMessage {
    readonly context?: NodeContext;
    readonly message: string;
}
