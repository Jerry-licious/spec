import {runAsWorker} from "synckit";


const importEverything = `
\\usepackage{tikz-cd}
\\usepackage{amssymb}
`;

const additionalPreamble = `
\\AtBeginDocument{\\fontsize{14}{19}\\selectfont}
`;

const tikzLibraries = "calc,decorations.pathmorphing";

// Adjusted from
// https://github.com/varkor/quiver/blob/master/package/quiver.sty
// Changes: removed the require packages and use tikz libraries.
// Removed spath3, because it is not supported.
// Removed the between command.
const quiverSource = `
% *** quiver ***
% A package for drawing commutative diagrams exported from https://q.uiver.app.
%
% This package is currently a wrapper around the \`tikz-cd\` package, importing necessary TikZ
% libraries, and defining new TikZ styles for curves of a fixed height and for shortening paths
% proportionally.
%
% Version: 1.6.0
% Authors:
% - varkor (https://github.com/varkor)
% - AndréC (https://tex.stackexchange.com/users/138900/andr%C3%A9c)
% - Andrew Stacey (https://tex.stackexchange.com/users/86/andrew-stacey)

% A TikZ style for curved arrows of a fixed height, due to AndréC.
\\tikzset{curve/.style={settings={#1},to path={(\\tikztostart)
    .. controls ($(\\tikztostart)!\\pv{pos}!(\\tikztotarget)!\\pv{height}!270:(\\tikztotarget)$)
    and ($(\\tikztostart)!1-\\pv{pos}!(\\tikztotarget)!\\pv{height}!270:(\\tikztotarget)$)
    .. (\\tikztotarget)\\tikztonodes}},
    settings/.code={\\tikzset{quiver/.cd,#1}
        \\def\\pv##1{\\pgfkeysvalueof{/tikz/quiver/##1}}},
    quiver/.cd,pos/.initial=0.35,height/.initial=0}

% TikZ arrowhead/tail styles.
\\tikzset{tail reversed/.code={\\pgfsetarrowsstart{tikzcd to}}}
\\tikzset{2tail/.code={\\pgfsetarrowsstart{Implies[reversed]}}}
\\tikzset{2tail reversed/.code={\\pgfsetarrowsstart{Implies}}}
% TikZ arrow styles.
\\tikzset{no body/.style={/tikz/dash pattern=on 0 off 1mm}}
`

process.stderr.write = (chunk: any) => {
    process.stdout.write(chunk);
    return true;
};

runAsWorker(async (tikzCode: string, preamble: string) => {
    const mod = await import('node-tikzjax');
    const tex2svg = (mod as any).default?.default ?? mod.default;

    const source = `
            \\begin{document}
            ${tikzCode}
            \\end{document}
            `;

    return await tex2svg(source, {
        tikzLibraries: tikzLibraries,
        addToPreamble: `
                        ${importEverything}
                        ${additionalPreamble}
                        ${quiverSource}
                        ${preamble}
                    `,
        embedFontCss: true,
    });
})