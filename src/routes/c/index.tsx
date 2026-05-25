import {getConfig} from "../../app-data";
import {createAsync} from "@solidjs/router";
import {Page} from "../../components/Page";
import {ErrorBoundary, Show} from "solid-js";
import {getAllComments, isLocalhostQuery} from "../../comment";
import {CommentBlock} from "../../components/CommentBlock";


export const route = {
    preload: () => {
        getConfig();
        getAllComments();
    },
};

export default function AllCommentView() {
    const config = createAsync(() => getConfig());
    const comments = createAsync(() => getAllComments());
    const local = createAsync(() => isLocalhostQuery());

    const failMessage = "Failed to load comments. Please try again later. ";

    return<ErrorBoundary fallback={
        <Page titleText={`Comments Failed to Load | ${config()?.siteTitle}`} description={failMessage}
              title={'All Comments'} displayTitle={true}>
            {failMessage}
        </Page>
    }>
        <Show when={comments()}>
            <Page titleText={`Comments | ${config()?.siteTitle}`}
                  title={'All Comments'}
                  displayTitle={true}>
                <div class={'all-comment-list'}>
                    {comments()!.map((comment) =>
                        <CommentBlock comment={comment} allowDelete={!!local()}/>)}
                </div>
            </Page>
        </Show>
    </ErrorBoundary>
}
