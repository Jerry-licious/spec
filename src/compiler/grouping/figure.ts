import {IRUnit} from "./unit";
import {Environment} from "@unified-latex/unified-latex-types";

// Currently there's nothing to change.
export class Figure extends IRUnit {
    constructor({parent, environment, label, tag, numbering}: {
        parent?: IRUnit;
        environment?: Environment;
        label?: string;
        tag: number;
        numbering?: number[];
    }) {
        super({
            parent, mainContent: environment ? [environment] : [],
            sourceNodeType: 'environment', sourceNodeName: 'figure',
            name: 'Figure', label, title: [], tag, numbering, parasitic: true,
            isDivision: false
        });
    }
}