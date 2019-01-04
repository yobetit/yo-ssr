const chalk = require("chalk");

function log(message) {
  try {
    console.log("🐶  Yo-SSR:", message);
  } catch (error) {
    console.log("Yo-SSR:", message);
  }
}

class Logger {
  static info() {
    log(chalk.gray(...arguments));
  }

  static success() {
    log(chalk.green(...arguments));
  }

  static error() {
    log(chalk.red(...arguments));
  }

  static warning() {
    log(chalk.yellow(...arguments));
  }
}

module.exports = Logger;
