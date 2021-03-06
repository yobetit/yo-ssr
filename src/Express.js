const express = require("express");
const Options = require("./Options");
const Logger = require("./Logger");

const app = express();

class Express {
  static startServer() {
    if (Options.get("skipServer")) {
      Logger.info("server skipped");
    } else {
      app.use(express.static(Options.getBuildPath()));
      app.get("*", (_, response) => response.sendFile(Options.getIndexPath()));

      const port = Options.get("port");
      app.listen(port);

      Logger.info("server started on port", port);

      if (Options.get("serverHook")) {
        const serverHook = require(Options.getServerHook());
        serverHook(app, Options);

        Logger.info("server hook executed");
      }
    }
  }
}

module.exports = Express;
