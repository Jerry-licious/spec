// @refresh reload
import {createHandler, StartServer} from "@solidjs/start/server";


const mathJaxInit = `
window.MathJax = {
    loader: {
        load: ['[custom]/xypic.js'],
        paths: { custom: 'https://cdn.jsdelivr.net/gh/sonoisa/XyJax-v3@3.0.1/build/' }
    },
    tex: {
        packages: { '[+]': ['xypic'] },
        inlineMath: [['$', '$']]
    },
    startup: {
        ready() {
            MathJax.startup.defaultReady();
            const preambleElement = document.querySelector('#preamble');
            if (preambleElement) {
                MathJax.tex2mml(preambleElement.innerText);
            }
        }
    }
};`

export default createHandler(() => {
    return (
        <StartServer
            document={({assets, children, scripts}) => (
                <html lang="en">
                <head>
                    <meta charset="utf-8"/>
                    <meta name="viewport" content="width=device-width, initial-scale=1"/>
                    <link rel="icon" href="/favicon.ico"/>
                    <script innerHTML={mathJaxInit}/>
                    <script
                        id="MathJax-script" async
                        src="https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-chtml-full.js"
                    />
                    {assets}
                </head>
                <body>
                <div id="app">{children}</div>
                {scripts}
                </body>
                </html>
            )}
        />
    )
});
