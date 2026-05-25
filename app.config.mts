import { defineConfig } from "@solidjs/start/config";
import babel from 'vite-plugin-babel';


// The unified ecosystem doesn't seem to be so unified after all, each piece requiring a different version of their
// own subpackages.
// Let's see if inlining these libraries will fix it.
const INLINE_PATTERNS: (string | RegExp)[] = [
    // @unified-latex and its entire transitive closure
    /^@unified-latex\//,
    // core unified pipeline
    'unified', 'bail', 'is-plain-obj', 'trough',
    // vfile ecosystem
    'vfile', 'vfile-message',
    // hast utilities
    /^hast-util-/, 'hastscript', 'property-information', 'space-separated-tokens', 'comma-separated-tokens', 'web-namespaces', 'html-void-elements', 'zwitch',
    // unist utilities
    /^unist-util-/,
    // rehype plugins
    /^rehype-/,
    // mdast utilities
    /^mdast-util-/,
    // micromark (pulled in by mdast-util-to-hast)
    /^micromark/,
    // prettier (two versions: v2 for unified-latex-util-to-string, v3 for unified-latex-prettier)
    'prettier',
    // parse5 + entities (version split between jsdom/babel and hast-util-raw)
    'parse5', 'entities',
    // misc pure-JS deps of the above
    'trim-lines', 'decode-named-character-reference', 'character-entities', /^@ungap\//,
];

export default defineConfig({
    server: {
        preset: 'node-server',
        externals: {
            inline: INLINE_PATTERNS,
        },
    },
    // For an explanation of this, see babel.md
    vite: {
        plugins: [
            babel({
                filter: /src\/db\/.*\.ts$/,
                babelConfig: {
                    babelrc: false,
                    configFile: false,
                    presets: [
                        '@babel/preset-typescript'
                    ],
                    plugins: [
                        ['@babel/plugin-proposal-decorators', { legacy: true }],
                        ['@babel/plugin-proposal-class-properties', { loose: true }]
                    ]
                }
            })
        ]
    }
});
