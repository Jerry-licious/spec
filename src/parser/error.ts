export interface Location {
    filePath: string;
    line: number;
    column: number;
}

export interface ParsingMessage {
    location?: Location;
    message: string;
}
