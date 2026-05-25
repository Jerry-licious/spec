import type {APIEvent} from "@solidjs/start/server";
import xypicSource from "../../mathjax/xypic.js?raw";

const files: Record<string, string> = {
    "xypic.js": xypicSource,
};

// Needing to host xypic is a curious case: MathJax does not work on Firefox with incognito mode on my devices due to
// xypic not loading, and that comes from jsdelivr not being trusted.
// However, this does not make sense, since MathJax itself is also served by jsdelivr. That said, xypic comes from its
// own repository, while MathJax uses the npm repository. As such, this could be the cause of the trouble.
// While it is nice to also be able to host MathJax, such that MathJax is always available on my site whenever my site
// is available, MathJax actually comes in a big package with its own font files and such. Therefore it is too much
// of a hassle for an unforeseen benefit.
export async function GET({ params }: APIEvent) {
    const rel = (Array.isArray(params.path) ? params.path.join("/") : params.path) ?? "";

    const content = files[rel];
    if (!content) return new Response("Not Found", { status: 404 });

    return new Response(content, {
        headers: {
            "content-type": "application/javascript; charset=utf-8",
            "cache-control": "public, max-age=31536000, immutable",
        },
    });
}