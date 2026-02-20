import { defineConfig } from "@solidjs/start/config";
import babel from 'vite-plugin-babel';

export default defineConfig({
    server: {
        preset: 'bun'
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
