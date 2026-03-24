import {Title} from "@solidjs/meta";
import {HttpStatusCode} from "@solidjs/start";
import {Page} from "../components/Page";
import {getConfig} from "../app-data";
import {createAsync, useNavigate} from "@solidjs/router";
import {onMount} from "solid-js";

export const route = {
    preload: () => {
        getConfig();
    },
};

export default function NotFound() {
    const navigate = useNavigate();
    const config = createAsync(() => getConfig());
    const notFoundDescription = "The page that you are looking for does not exist.";

    onMount(() => {
        if (sessionStorage.getItem("invalidate_reload")) {
            sessionStorage.removeItem("invalidate_reload");
            navigate("/", { replace: true });
        }
    });

    return (
        <Page titleText={`404 | ${config()?.siteTitle}`} description={notFoundDescription} title={`404`} displayTitle={true}>
            {notFoundDescription}
        </Page>
    );
}
