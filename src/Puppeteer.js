const jsdom = require("jsdom");
const fsPath = require("fs-path");
const puppeteer = require("puppeteer");
const Options = require("./Options");
const Logger = require("./Logger");
const File = require("./File");

const { JSDOM } = jsdom;
const crawledUrls = {};
const allLinks = { "/": true };
const waitFor = Options.get("waitFor");
const baseurl = Options.getBaseUrl();
let linksLength = 1;

class Puppeteer {
  static async startCrawler() {
    Logger.info("starting crawler");

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });
    } catch (error) {
      Logger.error("error on launching puppeteer", error);
      return;
    }

    let page;
    try {
      page = await browser.newPage();
    } catch (error) {
      Logger.error("error on opening new page", error);
    }

    await page.setUserAgent("Yo-SSR");

    if (Options.get("showConsole")) {
      page.on("console", message => Logger.warning(message.text()));
    }

    const entryPoint = Options.get("entry");
    await Puppeteer.recursivelyCrawl(browser, page, `${baseurl}${entryPoint}`);

    const crawled = Object.keys(crawledUrls);
    Logger.info("total crawled urls", crawled.length);
    Logger.info("all crawled urls\n", crawled.join("\n"));

    Puppeteer.generateSitemap();

    try {
      await browser.close();
    } catch (error) {
      console.log("error on closing puppeteer", error);
    }
  }

  static generateSitemap() {
    if (Options.get("sitemap")) {
      Logger.info("sitemap generated");

      const prodUrl = Options.get("prodUrl");

      const allUrls = Object.keys(allLinks)
        .concat(Options.get("sitemapUrls"))
        .map(link => `${prodUrl}${link}`)
        .join("\n");

      File.saveContent("/sitemap", allUrls, "txt");
    } else {
      Logger.info("sitemap not generated");
    }
  }

  static async recursivelyCrawl(browser, page, url) {
    Logger.info("going to", url);

    try {
      await page.goto(url, { waitUntil: "load" });
    } catch (error) {
      Logger.error("an error happened while opening", url, error);
      return;
    }

    if (waitFor) await page.waitFor(waitFor);
    crawledUrls[url] = true;
    linksLength--;

    let html;
    try {
      html = await page.content();
    } catch (error) {
      Logger.error("error when tried to get content", url, error);
      return;
    }

    File.saveContent(url, html);
    const links = Puppeteer.getAllLinks(html);

    if (links) {
      linksLength += links.length;
      Logger.info(links.length, "links found, remaining", linksLength);

      for (let link of links) {
        let href = link.getAttribute("href");
        href = `${baseurl}${href}`;

        await Puppeteer.recursivelyCrawl(browser, page, href);
      }
    }
  }

  static getAllLinks(html) {
    const dom = new JSDOM(html);

    let links = dom.window.document.getElementsByTagName("a");

    if (links) {
      links = Array.prototype.slice.call(links);

      links = links.filter(link => {
        const href = link.getAttribute("href");
        const url = `${baseurl}${href}`;

        if (
          Puppeteer.isHrefValid(href) &&
          !allLinks[href] &&
          !crawledUrls[url]
        ) {
          allLinks[href] = true;
          return true;
        }
      });

      return links;
    }
  }

  static isHrefValid(href) {
    const include = Options.get("include");

    return (
      href &&
      !href.includes("http") &&
      !href.includes("mailto") &&
      !href.includes("tel") &&
      !href.includes("#") &&
      (href === "/" || include.some(inc => href.startsWith(inc)))
    );
  }
}

module.exports = Puppeteer;
