export interface UnitType {
    key: string; // Used in code, say \begin{lem}
    parentKey: string; // Will this unit latch on to a particular parent type?
    associatedCounter?: string; // Does this come with a counter?

    // What signifies the beginning of this unit? Is it \begin{key} or is it \key{title}?
    environment: boolean;
    // Weather this type will collect certain types of units that trail behind them. For example, a theorem may collect
    // a trailing proof.
    collectTrailing: string[];

    name: string; // Used to reference the names, say "see Lemma 2.3"
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