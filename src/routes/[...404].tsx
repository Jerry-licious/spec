import {Title} from "@solidjs/meta";
import {HttpStatusCode} from "@solidjs/start";
import {Page} from "../components/Page";
import {getConfig} from "../app-data";
import {createAsync} from "@solidjs/router";

export const route = {
    preload: () => {
        getConfig();
    },
};

export default function NotFound() {
    const config = createAsync(() => getConfig());
    const notFoundDescription = "The page that you are looking for does not exist.";

    return (
        <Page titleText={`404 | ${config()?.siteTitle}`} description={notFoundDescription} title={`404`} displayTitle={true}>
            {notFoundDescription}
        </Page>
    );
}
