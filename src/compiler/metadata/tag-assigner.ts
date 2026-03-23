import {DocumentVisitor} from "../visitor";
import {Environment, Macro, Node} from "@unified-latex/unified-latex-types";
import {VisitInfo} from "@unified-latex/unified-latex-util-visit";
import {match} from "@unified-latex/unified-latex-util-match";
import {nextSafeTag} from "../../tag";
import {ParserLogger} from "../logging-base";
import {getArgumentText, getEnvName} from "../util";


// In the present system, each unit, such as a chapter, section, or a theorem, will be assigned a unique ID known as a
// tag.
// Tags are internally represented as numbers, but externally represented as 36
export class TagAssigner extends DocumentVisitor {
    labelTagMap: Map<string, number>;
    nextAvailableTag: number;
    tagNodeMap: Map<number, Macro | Environment>;

    taggableMacros: Set<string>;
    taggableEnvironments: Set<string>;
    // Environments that are tagged for anchoring but do not become units (e.g. equations).
    // These should NOT receive synthetic labels since their tags are transient.
    nonUnitEnvironments: Set<string>;

    // Disambiguator for synthetic labels that share the same base key.
    private syntheticCounters: Map<string, number>;

    constructor({ labelTagMap, nextAvailableTag, taggableMacros, taggableEnvironments, nonUnitEnvironments, logger }: {
        labelTagMap?: Map<string, number>;
        nextAvailableTag?: number;
        taggableMacros?: Set<string>;
        taggableEnvironments?: Set<string>;
        nonUnitEnvironments?: Set<string>;
        logger?: ParserLogger
    }) {
        super({ logger });

        this.labelTagMap = labelTagMap ?? new Map();
        this.tagNodeMap = new Map<number, Macro | Environment>();

        this.taggableMacros = taggableMacros ?? new Set<string>();
        this.taggableEnvironments = taggableEnvironments ?? new Set<string>();
        this.nonUnitEnvironments = nonUnitEnvironments ?? new Set<string>();

        this.syntheticCounters = new Map<string, number>();

        if (nextAvailableTag) {
            this.nextAvailableTag = nextAvailableTag;
        } else {
            this.nextAvailableTag = this.labelTagMap.size ? Math.max(...this.labelTagMap.values()) + 1 : 1;
        }
    }

    // Build a stable synthetic label from the node's type and title text.
    // This lets unlabeled units keep the same tag across recompiles as long as
    // their title doesn't change.
    private generateSyntheticLabel(node: Node): string {
        let type: string;
        let titleParts: string[];

        if (match.anyMacro(node)) {
            type = node.content;
            titleParts = node.args ? node.args.map(a => getArgumentText(a)) : [];
        } else {
            type = getEnvName((node as any).env);
            titleParts = (node as any).args
                ? (node as any).args.map((a: any) => getArgumentText(a))
                : [];
        }

        const title = titleParts.filter(t => t.length > 0).join(':');
        const baseKey = `__auto:${type}:${title}`;
        const count = (this.syntheticCounters.get(baseKey) ?? 0) + 1;
        this.syntheticCounters.set(baseKey, count);

        return count === 1 ? baseKey : `${baseKey}:#${count}`;
    }

    private assignTag(node: Node, label: string): void {
        if (this.labelTagMap.has(label)) {
            node.meta = { ...node.meta, label };
            node.meta.tag = this.labelTagMap.get(label);
        } else {
            node.meta = { ...node.meta, label, tag: this.nextAvailableTag };
            this.labelTagMap.set(label, this.nextAvailableTag);
            this.nextAvailableTag = nextSafeTag(this.nextAvailableTag + 1);
        }
    }

    visit(node: Node, visitInfo: VisitInfo): void {
        if (!((match.anyEnvironment(node) && this.taggableEnvironments.has(getEnvName(node.env))) ||
            (match.anyMacro(node) && this.taggableMacros.has(node.content)))) return;

        if (node.meta && node.meta.label) {
            // Node already has a user-assigned label — use it for tag lookup.
            this.assignTag(node, node.meta.label);
        } else {
            // No label. For unit nodes (chapters, sections, theorems, etc.), generate
            // a synthetic label so the tag is stable across recompiles.
            // For non-unit nodes (equations), just assign a fresh tag.
            const isNonUnit = match.anyEnvironment(node) &&
                this.nonUnitEnvironments.has(getEnvName(node.env));

            if (!isNonUnit) {
                this.assignTag(node, this.generateSyntheticLabel(node));
            } else {
                node.meta = { ...node.meta, tag: this.nextAvailableTag };
                this.nextAvailableTag = nextSafeTag(this.nextAvailableTag + 1);
            }
        }

        // Register additional labels (from multi-row math environments like align)
        // to point to the same tag.
        const meta = node.meta as any;
        if (meta.additionalLabels) {
            for (const extraLabel of meta.additionalLabels) {
                if (!this.labelTagMap.has(extraLabel)) {
                    this.labelTagMap.set(extraLabel, node.meta!.tag!!);
                }
            }
        }

        // At this point the tag should be assigned already.
        this.tagNodeMap.set(node.meta!.tag!!, node);
    }
}
