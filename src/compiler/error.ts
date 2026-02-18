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


export function messageText(message: ParsingMessage) {
    if (!message.context) {
        return message.message;
    }
    return `${message.message}\nAt line ${message.context.line} column ${message.context.column} from ${message.context.filePath}:\n${message.context.content.trim()}`;
}
