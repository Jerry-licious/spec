
export class Counter {
    count: number;
    parent?: Counter;
    children: Counter[];

    constructor(parent: Counter | undefined = undefined) {
        this.count = 0;
        this.parent = parent;
        if (parent) {
            parent.children.push(this);
        }

        this.children = [];
    }

    reset() {
        this.count = 0;
    }

    // Returns the current tally.
    increment(): number[] {
        this.count++;
        this.children.map((c) => c.reset());

        return this.getCount();
    }

    // Returns an array of numbers indicating the count at each level.
    getCount(): number[] {
        return [
            ...(this.parent ? this.parent.getCount() : []),
            this.count
        ];
    }
}

// Manages counts based on keys
export class CountManager {
    counters: Map<string, Counter>;

    constructor() {
        this.counters = new Map();
    }

    hasCounter(key: string): boolean {
        return this.counters.has(key);
    }

    addCounter(key: string, parentKey: string | undefined = undefined) {
        if (this.counters.has(key)) {
            throw new Error(`Counter ${key} already exists.`);
        }
        if (parentKey && !this.counters.has(parentKey)) {
            throw new Error(`Counter ${key} does not exist.`);
        }
        const parentCounter = parentKey ? this.counters.get(parentKey) : undefined;

        this.counters.set(key, new Counter(parentCounter));
    }

    // Returns the current count of the given counter.
    increment(key: string): number[] {
        if (!this.counters.has(key)) {
            throw new Error(`Counter ${key} does not exist.`);
        }

        return this.counters.get(key)!!.increment();
    }
}

