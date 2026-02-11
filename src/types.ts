export interface Fragment {
    id: string;
    type: 'section' | 'theorem' | 'lemma' | 'definition';
    number: string;
    title?: string;
    content: string;
    html: string;
    sourceHash: string;
}

export interface Counters {
    section: number;
    theorem: [number, number]; // [section, number]
    lemma: [number, number];
    definition: [number, number];
}
