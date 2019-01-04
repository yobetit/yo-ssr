# ![Yobetit logo](https://cdn.yobetit.com/5.1.4-SNAPSHOT/dist/images//landing_page/yb_logo_tb-mobile.png) - Yo-SSR

:dog: Server Side Rendering lib using [Puppeteer](https://github.com/GoogleChrome/puppeteer) to crawl a [CRA 2](https://github.com/facebook/create-react-app) builded app!

## How it works?

1. After the build process finishes, the **yo-ssr** starts a express server;
2. Then, a [puppeteer](https://github.com/GoogleChrome/puppeteer) browser is launched;
3. The browser starts to crawl the app, starting from home;
4. The **yo-ssr** get all HTML content, finds all **A** tags and crawl it recursively;
5. On each page, the package saves a .html file following the name of the route;
6. Some options are available to configure how the package will work;

## Options

- WIP
