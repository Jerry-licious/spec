import {createAsync, useParams} from "@solidjs/router";
import {getConfig} from "../../app-data";
import {ErrorBoundary, Show} from "solid-js";
import {Page} from "../../components/Page";
import {getComment} from "../../comment";
import {CommentPage} from "../../components/CommentPage";


export const route = {
    preload: ({ params }: {  params: { id: string } }) => {
        getConfig();
        getComment(parseInt(params.id) || -1);
    },
};


export default function BibliographyView() {
    const params = useParams<{id: string}>();

    const comment = createAsync(() => getComment(parseInt(params.id) || -1));
    const config = createAsync(() => getConfig());

    const notFoundMessage = `Comment #${params.id} does not exist.`;

    return (
        <ErrorBoundary fallback={
            <Page titleText={`Comment Not Found | ${config()?.siteTitle}`}
                  description={notFoundMessage}
                  title={`Comment #${params.id} Not Found.`} displayTitle={true}>
                {notFoundMessage}
            </Page>
        }>
            <Show when={comment()}>
                <CommentPage comment={comment()!} />
            </Show>
        </ErrorBoundary>
    );
}
