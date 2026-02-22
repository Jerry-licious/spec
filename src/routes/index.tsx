import {Title} from "@solidjs/meta";
import {createGetUnit, getConfig} from "../app-data";
import {createAsync} from "@solidjs/router";



export const route = {
    preload: () => {
        getConfig();
        createGetUnit(() => 0);
    },
};

export default function Home() {
    const [mainPageResource] = createGetUnit(() => 0);
    const config = createAsync(() => getConfig());

    const mainPage = mainPageResource();

    return (
        <main>
            <Title>{config()?.siteTitle}</Title>
            <div innerHTML={mainPage?.contentHTML}/>
        </main>
    );
}
