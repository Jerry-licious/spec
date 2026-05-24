import type { APIEvent } from "@solidjs/start/server";
import xypicSource from "../../mathjax/xypic.js?raw";

const files: Record<string, string> = {
    "xypic.js": xypicSource,
};

export async function GET({ params }: APIEvent) {
    const rel = (Array.isArray(params.path) ? params.path.join("/") : params.path) ?? "";

    console.log(rel);

    const content = files[rel];
    if (!content) return new Response("Not Found", { status: 404 });

    return new Response(content, {
        headers: {
            "content-type": "application/javascript; charset=utf-8",
            "cache-control": "public, max-age=31536000, immutable",
        },
    });
}