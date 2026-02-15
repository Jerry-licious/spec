export interface Location {
    readonly filePath: string;
    readonly line: number;
    readonly column: number;
}

export interface ParsingMessage {
    readonly location?: Location;
    readonly message: string;
}
