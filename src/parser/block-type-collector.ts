import {Node} from "@unified-latex/unified-latex-types";
import {DocumentVisitor} from "./visitor";
import {CountManager} from "./counter";
import {match} from "@unified-latex/unified-latex-util-match";
import {getArgumentTexts} from "./util";
import {BlockType} from "./block-type";

export class BlockTypeCollector extends DocumentVisitor {
    countManager: CountManager;
    blockTypes: Map<string, BlockType>

    constructor(countManager: CountManager | undefined = undefined) {
        super();

        if (countManager) {
            this.countManager = countManager;
        } else {
            this.countManager = new CountManager();
        }

        this.blockTypes = new Map();
    }

    visit(node: Node): void {
        if (!match.macro(node, 'newtheorem')) return;

        // newtheorem comes with five arguments.
        // 0. A boolean corresponding to usecounter/not use counter. I will ignore this.
        // 1. The key of the environment.
        // 2. Shared counter.
        // 3. The name of the environment.
        // 4. The parent counter.
        // These arguments will always be given by the parser, even if they have empty content.
        // Argument 2 and 4 are mutually exclusive: use a shared, existing counter or use a parent counter.

        const args = getArgumentTexts(node);
        if (!args || args.length < 5) {
            this.addError('Missing argument for a \\newtheorem command.');
            return;
        }

        const key = args[1];
        if (!key) {
            this.addError('Missing key for \\newtheorem.');
            return;
        }
        if (this.blockTypes.has(key)) {
            this.addError(`Theorem type ${key} already exists.`);
            return;
        }

        const environmentName = args[3];
        if (!environmentName) {
            this.addError('Missing environment name for \\newtheorem.');
            return;
        }

        const sharedCounter = args[2];
        const parentCounter = args[4];

        if (sharedCounter) {
            if (parentCounter) {
                this.addError('Shared and parent counter arguments are mutually exclusive.');
                return;
            }

            if (!this.countManager.hasCounter(sharedCounter)) {
                this.addError(`Counter ${sharedCounter} does not exist.`);
                return;
            }

            this.blockTypes.set(key, {
                key: key, name: environmentName, associatedCounter: sharedCounter
            });
        } else {
            if (!parentCounter) {
                this.addError({
                    message: 'At least one counter must be specified.'
                });
                return;
            }

            if (this.countManager.hasCounter(key)) {
                this.addInfo(`Counter ${key} already exists.`);
                return;
            }

            if (!this.countManager.hasCounter(parentCounter)) {
                this.addError(`Counter ${parentCounter} does not exist.`);
                return;
            }

            this.countManager.addCounter(key, parentCounter);

            this.blockTypes.set(key, {
                key: key, name: environmentName, associatedCounter: key
            });
        }
    }
}


