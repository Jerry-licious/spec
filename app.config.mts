import { defineConfig } from "@solidjs/start/config";


// The unified ecosystem doesn't seem to be so unified after all, each piece requiring a different version of their
// own subpackages.
// Let's see if inlining these libraries will fix it.
const INLINE_PATTERNS: string[] = [
    '@unified-latex/', 'unified', 'bail', 'is-plain-obj', 'trough', 'vfile', 'vfile-message', 'hast-util-',
    'hastscript', 'property-information', 'space-separated-tokens', 'comma-separated-tokens',
    'web-namespaces', 'html-void-elements', 'zwitch', 'unist-util-', 'rehype-', 'mdast-util-',
    'micromark', 'prettier', 'parse5', 'entities', 'trim-lines', 'decode-named-character-reference',
    'character-entities', '@ungap/',
];

export default defineConfig({
    server: {
        preset: 'node-server',
        externals: {
            inline: INLINE_PATTERNS,
        },
    },
    // The solid plugin (vite-plugin-solid) processes all extensions including .ts
    // because solidstart passes extensions: ["js","jsx","ts","tsx"].
    // Decorator transforms must be injected into solid's own babel pass rather
    // than a separate vite-plugin-babel, which solid's enforce:'pre' transform
    // would run before anyway. solid.babel is merged into solid's babel options
    // before transformation (see vite-plugin-solid transform, lines 263-274).
    solid: {
        babel: {
            plugins: [
                ['@babel/plugin-proposal-decorators', { legacy: true }],
                ['@babel/plugin-proposal-class-properties', { loose: true }],
            ],
        },
    },
});