/**
 * Background Task and Cron Scheduler
 */

const cron = require('node-cron');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class Scheduler {
  constructor() {
    this.jobs = [];
    this.intervals = [];
  }

  init() {
    // 1. Temporary folder cleaner every 2 hours
    const tempDir = path.resolve(process.cwd(), 'temp');
    fs.ensureDirSync(tempDir);

    const tempCleaner = setInterval(() => {
      fs.readdir(tempDir, (err, files) => {
        if (err || !files) return;
        const now = Date.now();
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          fs.stat(filePath, (sErr, stats) => {
            if (!sErr && stats && now - stats.mtimeMs > 2 * 60 * 60 * 1000) {
              fs.unlink(filePath).catch(() => {});
            }
          });
        }
      });
    }, 2 * 60 * 60 * 1000);
    if (tempCleaner.unref) tempCleaner.unref();
    this.intervals.push(tempCleaner);

    // 2. Memory monitoring and garbage collection every 5 minutes
    const memMonitor = setInterval(() => {
      const used = process.memoryUsage().rss / 1024 / 1024;
      if (used > 450) {
        logger.warn(`[MEMORY] High RAM usage detected (${used.toFixed(2)} MB). Triggering cleanup.`);
        if (global.gc) {
          try { global.gc(); } catch (_) {}
        }
      }
    }, 5 * 60 * 1000);
    if (memMonitor.unref) memMonitor.unref();
    this.intervals.push(memMonitor);

    logger.info('Scheduler and background cleaners initialized');
  }

  schedule(cronExpression, taskFunction) {
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: "${cronExpression}"`);
    }
    const job = cron.schedule(cronExpression, taskFunction);
    this.jobs.push(job);
    return job;
  }

  stopAll() {
    for (const job of this.jobs) {
      job.stop();
    }
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.jobs = [];
    this.intervals = [];
    logger.info('All scheduled background tasks stopped cleanly');
  }
}

module.exports = new Scheduler();
