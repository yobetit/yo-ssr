const path = require("path");
const fsPath = require("fs-path");
const Options = require("./Options");
const Logger = require("./Logger");

class File {
  static saveContent(url, html, ext = "html") {
    let file = url.replace(Options.getBaseUrl(), "");

    if (file === "/") {
      file = `${file}index`;
    } else {
      file = file[file.length - 1] === "/" ? file.slice(0, -1) : file;
    }

    file = path.join(Options.getBuildPath(), `${file}.${ext}`);

    try {
      fsPath.writeFileSync(file, html);
      Logger.success("file saved", file);
    } catch (error) {
      Logger.error("file not saved", file, error);
    }
  }
}

module.exports = File;
