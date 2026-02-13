import {CountManager} from "./counter";

export interface UnitType {
    key: string; // Used in code, say \begin{lem}
    parentKey?: string; // Will this unit latch on to a particular parent type?
    associatedCounter?: string; // Does this come with a counter?

    // What signifies the beginning of this unit? Is it \begin{key} or is it \key{title}?
    environment: boolean;
    // Weather this type will collect certain types of units that trail behind them. For example, a theorem may collect
    // a trailing proof.
    collectTrailing: string[];

    name: string; // Used to reference the names, say "see Lemma 2.3"
}

export function getTheoremUnitType(key: string, name: string, counter: string): UnitType {
    return {
        key, name,
        associatedCounter: counter,
        parentKey: 'section',
        environment: true,
        collectTrailing: ['proof'],
    };
}

export function getNonTheoremUnitType(key: string, name: string, parent?: string): UnitType {
    return {
        key, associatedCounter: key,
        parentKey: parent,
        environment: false,
        collectTrailing: [],
        name: name,
    };
}


export class Unit<C> {
    type: UnitType;
    label?: string;

    title: C;
    body: C;

    children: Unit<C>[];
    trailing: Unit<C>[];

    constructor(type: UnitType, title: C, body: C) {
        this.type = type;
        this.title = title;
        this.body = body;

        this.trailing = [];
        this.children = [];
    }

    setLabel(label: string): void {
        this.label = label;
    }
}


export class UnitTypeManager {
    countManager: CountManager;
    types: Map<string, UnitType>;

    constructor() {
        this.countManager = new CountManager();
        this.types = new Map<string, UnitType>();
    }

    hasType(key: string): boolean {
        return this.types.has(key);
    }

    getType(key: string): UnitType {
        return this.types.get(key)!!;
    }

    registerType(type: UnitType): void {
        if (this.hasType(type.key)) {
            throw new Error(`Unit type ${type.key} already exists.`);
        }
        if (type.parentKey && !this.types.has(type.parentKey)) {
            throw new Error(`Unit type ${type.parentKey} does not exist. Parents must be registered before children.`);
        }
        if (type.associatedCounter && this.countManager.hasCounter(type.associatedCounter)) {
            throw new Error(`Counter ${type.associatedCounter} already exists. `);
        }

        // Register the corresponding counter.
        if (type.associatedCounter) {
            if (type.parentKey && this.getType(type.parentKey).associatedCounter) {
                // I will get to assume that the counter has already been added.
                this.countManager.addCounter(this.getType(type.parentKey).associatedCounter!!);
            } else {
                this.countManager.addCounter(type.associatedCounter);
            }
        }

        this.types.set(type.key, type);
    }
}


// Comes with some unit types by default. 
export class TexUnitTypeManager extends UnitTypeManager {
    constructor() {
        super();

        this.registerType(getNonTheoremUnitType('part', 'Part'));
        this.registerType(getNonTheoremUnitType('chapter', 'Chapter', 'part'));
        this.registerType(getNonTheoremUnitType('section', 'Section', 'chapter'));
        this.registerType(getNonTheoremUnitType('subsection', 'Subsection', 'section'));
        this.registerType(getNonTheoremUnitType('subsubsection', 'Subsubsection', 'subsection'));

        this.registerType({
            key: 'proof',
            environment: true,
            collectTrailing: [],
            name: 'Proof',
        });
    }
}

