import {AbstractProcessor} from "./processor";
import {Macro, Node, Root} from "@unified-latex/unified-latex-types";
import {match} from "@unified-latex/unified-latex-util-match";
import path, {join} from "node:path";
import {readFile} from "node:fs/promises";
import {ParsingMessage} from "./error";
import {parse} from "@unified-latex/unified-latex-util-parse";
import {visit} from "@unified-latex/unified-latex-util-visit";

const packageCommands = ['usepackage', 'RequirePackage']
const inputCommands = ['input', 'include'];

export class Loader extends AbstractProcessor<string, Promise<Root>, ParsingMessage> {
    readonly visitedFiles: Set<string> = new Set();

    async processContent(content: string, currentFile: string): Promise<Root> {
        const root = parse(content);
        const workingDirectory = path.dirname(currentFile);

        // Tag the node with source file position.
        visit(root, (node) => {
            if (!match.argument(node)) {
                node.meta = {
                    sourceFile: currentFile,
                };
            }
        })

        return {
            ...root,
            content: (await Promise.all(root.content.map(async (node: Node) => {
                const isPackageLoad = packageCommands.some((command: string) => match.macro(node, command));
                const isContentLoad = inputCommands.some((command: string) => match.macro(node, command));

                // Only process this if it's an input or an include.
                if (!isPackageLoad && !isContentLoad) {
                    return [node];
                }

                const inputCommand = node as Macro;

                const nodeLocation = {
                    filePath: currentFile,
                    ...node.position!!.start
                };

                // Input commands have their argument in position 0.
                if (isContentLoad) {
                    if (!inputCommand.args || !inputCommand.args[0]) {
                        this.addError({
                            message: 'No arguments given to the input command.',
                            context: nodeLocation
                        });
                        return [];
                    }
                } else {
                    // Use package commands have extra options, so the argument is actually in position 1.
                    if (!inputCommand.args || !inputCommand.args[1]) {
                        this.addError({
                            message: 'No arguments given to the import command.',
                            context: nodeLocation
                        });
                        return [];
                    }
                }

                const fileNameArgument = inputCommand.args!![isContentLoad ? 0 : 1].content;
                if (!fileNameArgument) {
                    this.addError({
                        message: 'No arguments given to the input command.',
                        context: nodeLocation
                    });
                    return [];
                }

                // From experiments, I should expect string nodes with contents.
                const fileName = fileNameArgument.map((piece) => piece.type === 'string' ? piece.content : '').join('');

                // Separate loading section here because in this case we can attribute any problem to the particular input command.
                let targetFile = join(workingDirectory, fileName);

                // Contents end with tex.
                if (isContentLoad) {
                    if (!targetFile.endsWith('.tex')) {
                        targetFile = targetFile + '.tex';
                    }
                } else {
                    // Packages end with sty
                    if (!targetFile.endsWith('.sty')) {
                        targetFile = targetFile + '.sty';
                    }
                }

                if (this.visitedFiles.has(path.normalize(targetFile))) {
                    if (isContentLoad) {
                        // Repeated content loads is a problem, so it gets an error.
                        this.addError({
                            message: `File ${targetFile} has already been visited once.`,
                            context: nodeLocation
                        });
                    } else {
                        // But repeated package loads can just be skipped.
                        this.addWarning({
                            message: `Package ${targetFile} has already been loaded.`,
                            context: nodeLocation
                        })
                    }

                    return [];
                }
                this.visitedFiles.add(path.normalize(targetFile));

                let fileContent = ""
                try {
                    fileContent = await readFile(targetFile, { encoding: 'utf8' });
                    this.addInfo({
                        message: `Loaded ${targetFile}.`,
                        context: nodeLocation
                    });
                } catch (e) {
                    if (isContentLoad) {
                        // Failing a content load is a problem.
                        this.addError({
                            message: `Failed to read file ${targetFile}.`,
                            context: nodeLocation
                        });
                    } else {
                        // But failing package loads is expected.
                        this.addWarning({
                            message: `Failed to load package ${targetFile}. This compiler supports exactly zero TeX packages.`,
                            context: nodeLocation
                        });
                    }
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