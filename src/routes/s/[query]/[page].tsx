import {getConfig} from "../../../app-data";
import {searchUnits} from "../../../app-data-cache";
import {useParams} from "@solidjs/router";
import {SearchPage} from "../../../components/SearchPage";

export const route = {
    preload: ({ params }: {  params: { query: string, page: string } }) => {
        getConfig();
        searchUnits(decodeURIComponent(params.query), parseInt(params.page) || 0);
    },
};


export default function SearchUnitsView() {
    const params = useParams<{query: string, page: string}>();

    return <SearchPage query={decodeURIComponent(params.query)} page={parseInt(params.page) || 0}/>
}
