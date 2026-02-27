import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity'

const matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
});

const codingAlphabet = '0123456789ACDEFGHJKLMNPQRTUVWXYZ';
const aliases: Record<string, string> = {
    'O': '0', 'I': '1', 'B': '8', 'S': '5'
}

export function toTagString(n: number): string {
    if (!Number.isInteger(n) || n < 0) throw new Error('Negative/non-integer tags are not allowed.');
    if (n === 0) return '0';

    let result = '';
    while (n > 0) {
        result = codingAlphabet[n % codingAlphabet.length] + result;
        n = Math.floor(n / 32);
    }

    return result;
}


export function fromTagString(s: string): number {
    const disambiguated = s.toUpperCase().replace(/[OIBS]/g, c => aliases[c]);
    if (!/^[0-9ACDEFGHJKLMNPQRTUVWXYZ]+$/.test(disambiguated)) {
        return NaN;
    }

    let result = 0;
    for (const char of disambiguated) {
        result = result * codingAlphabet.length + codingAlphabet.indexOf(char);
        if (result > Number.MAX_SAFE_INTEGER) return NaN;
    }
    return result;
}

// Paranoia gets to the best of me.
export function nextSafeTag(fromInclusive: number): number {
    const tagString = toTagString(fromInclusive);
    if (matcher.hasMatch(tagString)) {
        return nextSafeTag(fromInclusive + 1);
    }
    return fromInclusive;
}

