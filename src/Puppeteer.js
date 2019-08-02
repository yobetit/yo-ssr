const jsdom = require("jsdom");
const fsPath = require("fs-path");
const puppeteer = require("puppeteer");
const { matchPath } = require("react-router");
const Options = require("./Options");
const Logger = require("./Logger");
const File = require("./File");

const { JSDOM } = jsdom;

const baseurl = Options.getBaseUrl();
const include = Options.get("include");
const waitFor = Options.get("waitFor");

const crawledUrls = {};
const allLinks = { "/": true };
let linksLength = 0;
let pageHook;
let linksHook;

if (Options.get("pageHook")) pageHook = require(Options.getPageHook());
if (Options.get("linksHook")) linksHook = require(Options.getLinksHook());

class Puppeteer {
  static increaseLinksLength(value) {
    linksLength += value;

    Logger.info(value, "links added, remaining", linksLength);
  }

  static async launchBrowser() {
    try {
      return await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });
    } catch (error) {
      Logger.error("error on launching puppeteer", error);
    }
  }

  static async launchPages(browser, numOfPages, parentIndex) {
    try {
      let pages = [];

      for (let i = 0; i < numOfPages; i++) {
        Logger.info("creating page", parentIndex || "", i + 1);

        pages.push(browser.newPage());
      }

      pages = await Promise.all(pages);

      pages = pages.map((page, index) => {
        page.index = `${parentIndex ? parentIndex : ""} ${index + 1}`;
        return page;
      });

      return pages;
    } catch (error) {
      Logger.error("error on opening new page", error);
    }
  }

  static async configPages(pages) {
    const viewport = Options.get("viewport");

    if (viewport) {
      await Promise.all(
        pages.map(async page => {
          return page.setViewport(viewport);
        })
      );
    }

    await Promise.all(
      pages.map(async page => {
        return page.setUserAgent("Yo-SSR");
      })
    );

    if (Options.get("showConsole")) {
      pages.forEach(page => {
        page.on("console", message => Logger.warning(message.text()));
      });
    }

    await Promise.all(
      pages.map(async page => {
        page.on("request", request => {
          if (
            ["image", "stylesheet", "font"].indexOf(request.resourceType()) !==
            -1
          ) {
            request.abort();
          } else {
            request.continue();
          }
        });

        return await page.setRequestInterception(true);
      })
    );
  }

  static async setSubPages(browser, pages) {
    const numOfSubPages = Options.get("numOfSubPages");

    await Promise.all(
      pages.map(async page => {
        const pages = await Puppeteer.launchPages(
          browser,
          numOfSubPages,
          page.index
        );

        if (!pages) {
          page.pages = [page];
          return;
        }

        await Puppeteer.configPages(pages);

        page.pages = pages;
      })
    );
  }

  static async startCrawler() {
    Logger.info("starting crawler");

    const browser = await Puppeteer.launchBrowser();
    if (!browser) return;

    const numOfPages = Options.get("numOfPages");
    const pages = await Puppeteer.launchPages(browser, numOfPages);
    if (!pages) return;

    await Puppeteer.configPages(pages);
    await Puppeteer.setSubPages(browser, pages);

    const entries = Options.get("entries");

    Puppeteer.increaseLinksLength(entries.length);

    for (let i = 0; i < entries.length; i += numOfPages) {
      await Promise.all(
        pages.map((page, index) => {
          const entry = entries[i + index];

          if (entry) {
            allLinks[entry] = true;

            return Puppeteer.recursivelyCrawl(
              page,
              `${baseurl}${entry}`,
              page.pages
            );
          }
        })
      );
    }

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

      const sitemapUrls = Options.get("sitemapUrls").map(
        link => `${prodUrl}${link}`
      );

      const allUrls = Object.keys(allLinks)
        .map(link => {
          if (link[link.length - 1] === "/") {
            link = link.slice(0, -1);
          }

          return `${prodUrl}${link}/index.html`;
        })
        .concat(sitemapUrls)
        .join("\n");

      File.saveContent("/sitemap", allUrls, "txt");
    } else {
      Logger.info("sitemap not generated");
    }
  }

  static async crawl(page, url) {
    Logger.info("going to", url, "on page", page.index);

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

    return { html, links };
  }

  static async recursivelyCrawl(page, url, pages) {
    let { html, links } = await Puppeteer.crawl(page, url);

    const helpers = {
      pages,
      html,
      url,
      Logger,
      Options,
      Puppeteer,
      JSDOM,
      allLinks
    };

    if (Options.get("pageHook")) {
      await pageHook(helpers);
      Logger.info("page", page.index, "hook executed");
    }

    if (links) {
      Puppeteer.increaseLinksLength(links.length);

      for (let link of links) {
        let href = link.getAttribute("href");
        href = `${baseurl}${href}`;

        await Puppeteer.recursivelyCrawl(page, href, pages);
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
    return (
      href &&
      !href.includes("http") &&
      !href.includes("mailto") &&
      !href.includes("tel") &&
      !href.includes("#") &&
      (href === "/" || Puppeteer.matchUrl(href))
    );
  }

  static matchUrl(url) {
    return include.some(inc => {
      let props;
      if (typeof inc === "string") {
        props = { path: inc, exact: true };
      } else {
        props = inc;
      }

      return matchPath(url, props);
    });
  }
}

module.exports = Puppeteer;
