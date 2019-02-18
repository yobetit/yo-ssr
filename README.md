# ![Yobetit logo](https://firebasestorage.googleapis.com/v0/b/yobetit-firebase.appspot.com/o/common%2Ftransactions%2Fyobetit-logo.png?alt=media) - Yo-SSR

:dog: Server Side Rendering lib using [Puppeteer](https://github.com/GoogleChrome/puppeteer) to crawl a [CRA 2](https://github.com/facebook/create-react-app) builded app!

## How it works?

1. After the build process finishes, the **yo-ssr** starts a express server;
2. Then, a [puppeteer](https://github.com/GoogleChrome/puppeteer) browser is launched;
3. The browser starts to crawl the app, starting from home;
4. The **yo-ssr** get all HTML content, finds all **A** tags and crawl it recursively;
5. On each page, the package saves a .html file following the name of the route;
6. Some options are available to configure how the package will work;

## Options

- **port: default 12345**: the port wich express will use to serve the app while rendering;
- **skipServer: default false**: if you are using your own server, then you can skip server start;
- **waitFor: default 1000**: the amount of time in milliseconds to wait to render, in each page;
- **include: default []**: urls to include in the process, you can match using regex;
- **showConsole: default false**: boolean to show the console errors on your console;
- **entries: default ["/"]**: the entries lib will use to load and start to crawl;
- **prodUrl: default ""**: the url lib will use to put in sitemap.txt concatenated with urls;
- **sitemap: default true**: if true, sitemap.txt will be generated at the end, with all crawled urls;
- **sitemapUrls: default []**: if you need to inject another not crawled url on sitemap;
