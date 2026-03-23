#!/usr/bin/env node

import { program } from "commander";
// @ts-ignore
import {CompilerOptionOverride, runCompiler} from "../src";
import AsyncLock from 'async-lock'
import chokidar from "chokidar";
import consola from "consola";
import { createServer, ServerResponse } from "node:http";


const version = "v0.1.6";


program.command('serve')
    .description('Start the server on the given port.')
    .option('-p, --port <port>', 'Port of the server', (val) => {
        const n = parseInt(val);
        if (isNaN(n)) throw new Error('Port must be an integer.');
        return n;
    }, 3000)
    .action(async (opts) => {
        consola.info(`Spec ${version}. Starting the server...`);
        
        process.env.PORT = String(opts.port);
        // @ts-ignore
        await import('../../.output/server/index.mjs');
    });

program.command('compile')
    .description('Compiles the website.')
    .option('--all', 'Force the compiler to rerender every unit, even those that have not changed since the last render.', false)
    .action(async (opts) => {
        consola.info(`Spec ${version}. Starting the compiler...`);
        
        await runCompiler({
            compileAll: opts.all
        });
    });

program.command('version')
    .description("Displays the current version.")
    .action(() => consola.info("Spec {version}"));


const compileLock = new AsyncLock({maxPending: 2});
function compile(options: CompilerOptionOverride, onDone?: () => void) {
    compileLock.acquire('compile', async () => {
        await runCompiler(options);
        onDone?.();
    }).catch(() => {});
}

program.command('watch')
    .description('Starts the server on the given port, and will recompile the website whenever any change is detected in the current directory.')
    .option('-p, --port <port>', 'Port of the server', (val) => {
        const n = parseInt(val);
        if (isNaN(n)) throw new Error('Port must be an integer.');
        return n;
    }, 3000)
    .option('--compileAll', 'Force the compiler to rerender every unit, even those that have already been compiled before.', false)
    .action(async (opts) => {
        process.env.PORT = String(opts.port);

        consola.info(`Spec ${version}. Watching the current directory...`);

        // @ts-ignore
        import('../../.output/server/index.mjs');

        // SSE server for live reload: browsers connect and get notified after each recompile.
        const sseClients = new Set<ServerResponse>();
        const liveReloadPort = opts.port + 1;
        createServer((req, res) => {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
            });
            sseClients.add(res);
            req.on('close', () => sseClients.delete(res));
        }).listen(liveReloadPort);
        consola.info(`Live reload server on port ${liveReloadPort}.`);

        const notifyReload = () => {
            for (const client of sseClients) {
                client.write('data: reload\n\n');
            }
        };

        chokidar.watch('.', {
            ignoreInitial: true,
            ignored: (path, stats) => !!stats?.isFile() && !/\.(tex|sty|bib)$/.test(path)
        }).on('add', () => compile({
            compileAll: opts.all
        }, notifyReload)).on('change', () => compile({
            compileAll: opts.all
        }, notifyReload)).on('unlink', () => compile({
            compileAll: opts.all
        }, notifyReload))
    })

program.parse();
