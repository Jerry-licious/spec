// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";
import {config, loadConfig} from "./configs";
import {initialiseDatabase} from "./db";


// Initialise the config and the database.
await loadConfig();
await initialiseDatabase(config.database);

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
