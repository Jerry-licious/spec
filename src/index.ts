import "./parser/loader"
import {Loader} from "./parser/loader";
import {parse} from "@unified-latex/unified-latex-util-parse";


console.log('Happy developing ✨')


async function main() {
    const loader = new Loader();
    const root = await loader.process('./text.tex');
    console.log(loader.errors)
    console.log(root);
}

main().catch(console.error);


