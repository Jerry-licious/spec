#!/usr/bin/env node

import { program } from "commander";
// @ts-ignore
import {runCompiler} from "../src/index.js";


program.command('serve')
    .description('Start the server on the given port.')
    .option('-p, --port <port>', 'Port of the server', (val) => {
        const n = parseInt(val);
        if (isNaN(n)) throw new Error('Port must be an integer.');
        return n;
    }, 3000)
    .action(async (opts) => {
        process.env.PORT = String(opts.port);
        // @ts-ignore
        await import('../../.output/server/index.mjs');
    });

program.command('compile')
    .description('Compiles the website.')
    .option('--all', 'Force the compiler to rerender every unit, even those that have already been compiled before.', false)
    .action(async (opts) => {
        await runCompiler(opts.all);
    });

program.parse();
