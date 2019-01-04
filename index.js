const path = require('path')
const express = require('express')
const puppeteer = require('puppeteer')
const jsdom = require('jsdom')
const fsPath = require('fs-path')
const chalk = require('chalk')

// After build, SSR starts a simple express server and navigate through all site, saving html contents

const options = {
  timeToLoad: 1000,
  includes: ['/promotions', '/content'],
}

const { JSDOM } = jsdom
const port = 12345
const baseurl = `http://localhost:${port}`
const crawledUrls = {}

const app = express()

// --- STARTING EXPRESS SERVER ---

app.use(express.static(path.join(__dirname, 'build')))
const entryPath = path.join(__dirname, 'build', 'index.html')

app.get('*', (req, res) => res.sendFile(entryPath))
app.listen(port)

// --- STARTING CRAWLER ---

async function saveFile(url, html) {
  let file = url.replace(baseurl, '')
  file = file[file.length - 1] === '/' ? `${file}index` : file

  try {
    fsPath.writeFileSync(`build${file}.html`, html)
    console.log(chalk.green('SSR:', 'the file was saved', file))
  } catch (error) {
    console.log(chalk.red('SSR:', 'the file was not saved', file, error))
  }
}

function checkHrefIsValid(href) {
  return (
    href &&
    !href.includes('http') &&
    !href.includes('mailto') &&
    !href.includes('tel') &&
    !href.includes('#') &&
    (href === '/' || options.includes.some((inc) => href.startsWith(inc)))
  )
}

async function parserDom(browser, page, html) {
  const dom = new JSDOM(html)

  let links = dom.window.document.getElementsByTagName('a')

  if (links) {
    links = Array.prototype.slice.call(links)

    // eslint-disable-next-line
    for (let link of links) {
      let href = link.getAttribute('href')

      if (checkHrefIsValid(href)) {
        href = `${baseurl}${href}`

        // eslint-disable-next-line
        if (!crawledUrls[href]) await crawler(browser, page, href)
      }
    }
  }
}

async function crawler(browser, page, url) {
  console.log('SSR:', 'going to', url)

  try {
    await page.goto(url, { waitUntil: 'load' })
  } catch (error) {
    console.log('SSR:', 'some error happened when go to', url, error)
    return
  }

  if (options.timeToLoad) await page.waitFor(options.timeToLoad)
  crawledUrls[url] = true

  let html
  try {
    html = await page.content()
  } catch (error) {
    console.log('SSR:', 'error when tried to get content', url, error)
    return
  }

  await saveFile(url, html)
  await parserDom(browser, page, html)
}

async function runSSR() {
  console.log(chalk.gray('SSR:', 'launching puppeteer'))

  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  } catch (error) {
    console.log('SSR:', 'error on launching puppeteer', error)
    process.exit()
  }

  let page
  try {
    page = await browser.newPage()
  } catch (error) {
    console.log('SSR:', 'error on opening new page', error)
    process.exit()
  }

  await crawler(browser, page, `${baseurl}/`)

  try {
    await browser.close()
  } catch (error) {
    console.log('SSR:', 'error on closing puppeteer', error)
  }

  process.exit()
}

runSSR()
