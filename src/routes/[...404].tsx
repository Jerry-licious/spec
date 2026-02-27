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

  return (
      <Page titleText={`404 | ${config()?.siteTitle}`} title={`404`} displayTitle={true}>
          The page that you are looking for does not exist.
      </Page>
  );
}
