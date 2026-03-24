import type {APIEvent} from "@solidjs/start/server";

declare global {
    var __invalidate_controllers: Set<ReadableStreamDefaultController> | undefined;
}

globalThis.__invalidate_controllers ??= new Set();
const controllers = globalThis.__invalidate_controllers;

const encoder = new TextEncoder();

export function broadcastInvalidate() {
    for (const ctrl of controllers) {
        ctrl.enqueue(encoder.encode("event: reload\ndata:\n\n"));
    }
}

export function GET(_event: APIEvent) {
    let ctrl: ReadableStreamDefaultController;

    const stream = new ReadableStream({
        start(c) { controllers.add(ctrl = c); },
        cancel() { controllers.delete(ctrl); }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    });
}