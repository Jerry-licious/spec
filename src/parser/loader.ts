import {DocumentProcessor} from "./processor";
import {Root, Macro, Node} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import path, {join} from "node:path";
import {readFile} from "node:fs/promises";
import {ParsingMessage} from "./error";
import {parse} from "@unified-latex/unified-latex-util-parse";

const inputCommands = ['input', 'include'];

export class Loader extends DocumentProcessor<string, Promise<Root>, ParsingMessage> {
    visitedFiles: Set<string> = new Set();


    async processContent(content: string, currentFile: string): Promise<Root> {
        const root = parse(content);
        const workingDirectory = path.dirname(currentFile);

        return {
            ...root,
            content: (await Promise.all(root.content.map(async (node: Node) => {
                // Only process this if it's an input or an include.
                if (!inputCommands.some((command: string) => match.macro(node, command))) {
                    return [node];
                }

                const inputCommand = node as Macro;

                const nodeLocation = {
                    filePath: currentFile,
                    ...node.position!!.start
                };

                if (!inputCommand.args || !inputCommand.args[0]) {
                    this.addError({
                        message: 'No arguments given to the input command.',
                        location: nodeLocation
                    });
                    return [];
                }

                const fileNameArgument = inputCommand.args!![0].content;
                if (!fileNameArgument) {
                    this.addError({
                        message: 'No arguments given to the input command.',
                        location: nodeLocation
                    });
                    return [];
                }

                // From experiments, I should expect string nodes with contents.
                const fileName = fileNameArgument.map((piece) => piece.type === 'string' ? piece.content : '').join('');

                // Separate loading section here because in this case we can attribute any problem to the particular input command.
                let targetFile = join(workingDirectory, fileName);
                if (!targetFile.endsWith('.tex')) {
                    targetFile = targetFile + '.tex';
                }

                if (this.visitedFiles.has(path.normalize(targetFile))) {
                    this.addError({
                        message: `File ${targetFile} has already been visited once.`,
                        location: nodeLocation
                    });
                    return [];
                }
                this.visitedFiles.add(path.normalize(targetFile));

                let fileContent = ""
                try {
                    fileContent = await readFile(targetFile, { encoding: 'utf8' });
                } catch (e) {
                    this.addError({
                        message: `Failed to read file ${targetFile}.`,
                        location: nodeLocation
                    });
                }

                return (await this.processContent(fileContent, targetFile)).content
            }))).flat(),
        };
    }

    async process(file: string): Promise<Root> {
        let fileContent = ""
        try {
            fileContent = await readFile(file, { encoding: 'utf8' });
        } catch (e) {
            this.addError({
                message: `Failed to read file ${file}.`,
            });
        }

        // Record the file.
        this.visitedFiles.add(path.normalize(file));

        return this.processContent(fileContent, file);
    }
}