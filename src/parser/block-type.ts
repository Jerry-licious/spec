export interface BlockType {
    readonly key: string; // Used in code, say \begin{lem}
    readonly associatedCounter: string;
    readonly name: string; // Used to reference the names, say "see Lemma 2.3"
}



