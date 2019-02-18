const path = require("path");
const express = require("express");

const defaultOptions = {
  port: 12345,
  skipServer: false,
  waitFor: 1000,
  include: [],
  showConsole: false,
  entries: ["/"],
  prodUrl: "",
  sitemap: true,
  sitemapUrls: []
};

class Options {
  static get(name) {
    if (typeof yoSsr[name] === "undefined") {
      return defaultOptions[name];
    }

    return yoSsr[name];
  }

  static getRoot() {
    return process.cwd();
  }

  static getPkgJsonPath() {
    return path.join(Options.getRoot(), "package.json");
  }

  static getBuildPath() {
    return path.join(Options.getRoot(), "build");
  }

  static getIndexPath() {
    return path.join(Options.getRoot(), "build", "index.html");
  }

  static getBaseUrl() {
    return `http://localhost:${Options.get("port")}`;
  }

  static getServerHook() {
    return path.join(Options.getRoot(), Options.get("serverHook"));
  }

  static getPageHook() {
    return path.join(Options.getRoot(), Options.get("pageHook"));
  }

  static getLinksHook() {
    return path.join(Options.getRoot(), Options.get("linksHook"));
  }
}

const pkgJson = require(Options.getPkgJsonPath());
const yoSsr = pkgJson["yo-ssr"];

module.exports = Options;
