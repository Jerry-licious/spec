import {APIEvent} from "@solidjs/start/server";
import {getRequestIP} from "vinxi/http";
import {broadcastInvalidate} from "./listen";


export async function POST(event: APIEvent) {
    const ip = getRequestIP(event.nativeEvent);
    if (ip !== '127.0.0.1' && ip !== '::1') {
        return new Response("Forbidden", { status: 403 })
    }

    broadcastInvalidate();

    return new Response(null, { status: 204 });
}
