#!/usr/bin/env node

const Logger = require("./src/Logger");
const Express = require("./src/Express");
const Puppeteer = require("./src/Puppeteer");

console.time();
Logger.info("starting");

Express.startServer();

Puppeteer.startCrawler()
  .then(() => {
    Logger.info("finished");
    console.timeEnd();
    process.exit();
  })
  .catch(error => {
    Logger.error("errored", error);
    console.timeEnd();
    process.exit();
  });
