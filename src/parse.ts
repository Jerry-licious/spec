import {unified} from 'unified';
import {parse} from '@unified-latex/unified-latex-util-parse';
import {unifiedLatexToHast} from '@unified-latex/unified-latex-to-hast';
import {toHtml} from 'hast-util-to-html';
import {visit} from '@unified-latex/unified-latex-util-visit';
import {match} from '@unified-latex/unified-latex-util-match';
import {createHash} from 'crypto';
import type {Counters, Fragment} from './types';

const latexContent = `\\documentclass{article}
\\newtheorem{theorem}{Theorem}[section]
\\newtheorem{lemma}{Lemma}[section]

\\newcommand{\\test}{BOOO}

\\begin{document}

\\input{dummy.tex}

\\section{First Section}
Some text.
\\begin{theorem}[xxxx]
First theorem.
\\end{theorem}
\\begin{lemma}
First $x^2\\frac{x}{y}\\test$ lemma. \\textbf{Hello}. 
\\begin{enumerate}
\\item xxx
\\item yyy
\\item zzz
\\end{enumerate}
\\end{lemma}
\\section{Second Section}
More text.
\\begin{theorem}
Second theorem.

second paragraph $\\math$
\\end{theorem}
\\end{document}`;

// Helper to extract text from AST nodes
function extractText(nodes: any): string {
    if (!nodes) return '';
    if (!Array.isArray(nodes)) nodes = [nodes];
    return nodes
        .map((n: any) => {
            if (n.type === 'string') return n.content;
            if (n.type === 'whitespace') return ' ';
            if (n.content) return extractText(n.content);
            return '';
        })
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
}

// Parse LaTeX to AST
const ast = parse(latexContent);

// Counter state
const counters: Counters = {
    section: 0,
    theorem: [0, 0],
    lemma: [0, 0],
    definition: [0, 0],
};

const fragments: Fragment[] = [];

// Walk AST and compute numbering
visit(ast, (node) => {
    if (match.macro(node, 'section')) {
        counters.section++;
        counters.theorem[0] = counters.section;
        counters.theorem[1] = 0;
        counters.lemma[0] = counters.section;
        counters.lemma[1] = 0;
        counters.definition[0] = counters.section;
        counters.definition[1] = 0;

        const titleText = extractText((node as any).args?.[0]?.content);

        fragments.push({
            id: `section_${counters.section}`,
            type: 'section',
            number: `${counters.section}`,
            title: titleText,
            content: titleText,
            html: '', // Will be filled below
            sourceHash: createHash('sha256').update(titleText).digest('hex'),
        });
    }

    if (match.environment(node, 'theorem')) {
        counters.theorem[1]++;
        const number = `${counters.theorem[0]}.${counters.theorem[1]}`;
        const contentText = extractText((node as any).content);

        fragments.push({
            id: `theorem_${counters.theorem[0]}_${counters.theorem[1]}`,
            type: 'theorem',
            number: number,
            content: contentText,
            html: '', // Will be filled below
            sourceHash: createHash('sha256').update(contentText).digest('hex'),
        });
    }

    if (match.environment(node, 'lemma')) {
        counters.lemma[1]++;
        const number = `${counters.lemma[0]}.${counters.lemma[1]}`;
        const contentText = extractText((node as any).content);

        fragments.push({
            id: `lemma_${counters.lemma[0]}_${counters.lemma[1]}`,
            type: 'lemma',
            number: number,
            content: contentText,
            html: '', // Will be filled below
            sourceHash: createHash('sha256').update(contentText).digest('hex'),
        });
    }
});

// Convert each fragment to HTML
const processor = unified().use(unifiedLatexToHast as any);

// Re-walk AST with index to match fragments
let fragmentIndex = 0;
visit(ast, (node) => {
    if (
        match.macro(node, 'section') ||
        match.environment(node, 'theorem') ||
        match.environment(node, 'lemma')
    ) {
        if (fragmentIndex < fragments.length) {
            const hast = processor.runSync({type: 'root', content: [node]} as any);
            const html = toHtml(hast as any);
            fragments[fragmentIndex].html = html;
            fragmentIndex++;
        }
    }
});

// Export for use in store.ts
export {fragments};

// Print summary
console.log('Parsed fragments:');
fragments.forEach((f) => {
    console.log(`  ${f.type} ${f.number}: ${f.html}`);
});
console.log(`\nTotal: ${fragments.length} fragments`);
