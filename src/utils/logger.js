/**
 * Structured colorful logger for Goat Bot V2 (WhatsApp Edition)
 */

const chalk = require('chalk');
const moment = require('moment-timezone');
const config = require('../config');

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel = (process.env.LOG_LEVEL || config.logLevel || 'info').toLowerCase();

function getTimestamp() {
  return moment().tz(config.timeZone || 'UTC').format('HH:mm:ss');
}

const logger = {
  debug(...args) {
    if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.debug) {
      console.log(chalk.gray(`[${getTimestamp()}] [DEBUG]`), ...args);
    }
  },

  info(...args) {
    if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.info) {
      console.log(chalk.cyan(`[${getTimestamp()}] [INFO]`), ...args);
    }
  },

  warn(...args) {
    if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.warn) {
      console.log(chalk.yellow(`[${getTimestamp()}] [WARN]`), ...args);
    }
  },

  error(...args) {
    console.error(chalk.red(`[${getTimestamp()}] [ERROR]`), ...args);
  },

  err(...args) {
    logger.error(...args);
  },

  master(tag, ...args) {
    console.log(chalk.magenta(`[${getTimestamp()}] [${tag.toUpperCase()}]`), ...args);
  },

  command(cmdName, sender, isGroup) {
    const loc = isGroup ? chalk.green('Group') : chalk.blue('DM');
    console.log(
      chalk.green(`[${getTimestamp()}] [CMD]`),
      chalk.bold(cmdName),
      chalk.gray(`by ${sender}`),
      `(${loc})`
    );
  },

  banner() {
    const border = '═'.repeat(60);
    console.log(chalk.cyan(border));
    console.log(chalk.bold.magenta('  🐐 GOAT BOT V2 (WHATSAPP EDITION)'));
    console.log(chalk.gray('  Powered by Baileys v7.0.0-rc14 • High-Performance Framework'));
    console.log(chalk.cyan(border));
    console.log(`  ${chalk.cyan('•')} ${chalk.bold('Bot Name    :')} ${config.botName}`);
    console.log(`  ${chalk.cyan('•')} ${chalk.bold('Prefix      :')} ${config.prefix}`);
    console.log(`  ${chalk.cyan('•')} ${chalk.bold('Owner       :')} ${config.ownerName} (${config.ownerNumber || 'Not set'})`);
    console.log(`  ${chalk.cyan('•')} ${chalk.bold('Environment :')} ${process.env.NODE_ENV || 'production'}`);
    console.log(`  ${chalk.cyan('•')} ${chalk.bold('Node Engine :')} Node ${process.version}`);
    console.log(chalk.cyan(border) + '\n');
  }
};

module.exports = logger;
