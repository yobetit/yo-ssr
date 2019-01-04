#!/usr/bin/env node

const Logger = require("./src/Logger");
const Express = require("./src/Express");
const Puppeteer = require("./src/Puppeteer");

Logger.info("starting");

Express.startServer();

Puppeteer.startCrawler()
  .then(() => {
    Logger.info("finished");
    process.exit();
  })
  .catch(error => {
    Logger.error("errored", error);
    process.exit();
  });
