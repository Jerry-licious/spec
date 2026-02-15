import {DocumentVisitor} from "../visitor";
import {Environment, Macro, Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";



// In the present system, each unit, such as a chapter, section, or a theorem, will be assigned a unique ID known as a
// tag.
// Tags are internally represented as numbers, but externally represented as 36
export class TagAssigner extends DocumentVisitor {
    labelTagMap: Map<string, number>;
    nextAvailableTag: number;
    tagNodeMap: Map<number, Macro | Environment>;

    taggableMacros: Set<string>;
    taggableEnvironments: Set<string>;

    constructor({ labelTagMap, nextAvailableTag, taggableMacros, taggableEnvironments }: {
        labelTagMap?: Map<string, number>;
        nextAvailableTag?: number;
        taggableMacros?: Set<string>;
        taggableEnvironments?: Set<string>;
    }) {
        super();

        this.labelTagMap = labelTagMap ?? new Map();
        this.tagNodeMap = new Map<number, Macro | Environment>();

        this.taggableMacros = taggableMacros ?? new Set<string>();
        this.taggableEnvironments = taggableEnvironments ?? new Set<string>();

        if (nextAvailableTag) {
            this.nextAvailableTag = nextAvailableTag;
        } else {
            this.nextAvailableTag = this.labelTagMap.size ? Math.max(...this.labelTagMap.values()) + 1 : 1;
        }
    }

    visit(node: Node, visitInfo: VisitInfo): void {
        if (!((match.anyEnvironment(node) && this.taggableEnvironments.has(node.env)) ||
            (match.anyMacro(node) && this.taggableMacros.has(node.content)))) return;

        // If a label is already present, attempt to acquire it.
        if (node.meta && node.meta.label) {
            if (this.labelTagMap.has(node.meta.label)) {
                node.meta.tag = this.labelTagMap.get(node.meta.label);
            } else {
                node.meta.tag = this.nextAvailableTag;
                this.labelTagMap.set(node.meta.label, node.meta.tag);
                this.nextAvailableTag++;
            }
        } else {
            this.addWarning('Node does not have a label, and will receive a new tag.')

            // Otherwise, make a brand new tag for the node.
            node.meta = {
                ...node.meta,
                tag: this.nextAvailableTag
            };
            this.nextAvailableTag++;
        }

        // At this point the tag should be assigned already.
        this.tagNodeMap.set(node.meta.tag!!, node);
    }
}
