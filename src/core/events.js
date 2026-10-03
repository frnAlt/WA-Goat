/**
 * Modular Event Dispatcher and Registry
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class EventManager {
  constructor() {
    this.events = new Map();
  }

  register(eventModule, sourceFile = '') {
    if (!eventModule) return false;
    const name = eventModule.name || eventModule.config?.name;
    if (!name) return false;

    this.events.set(name.toLowerCase(), {
      name: name.toLowerCase(),
      sourceFile,
      raw: eventModule,
      execute: eventModule.execute || eventModule.onStart || eventModule
    });
    return true;
  }

  loadFromDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return 0;
    let count = 0;
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.resolve(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (['assets', 'data', 'node_modules', '.git'].includes(item)) continue;
        count += this.loadFromDirectory(fullPath);
      } else if (item.endsWith('.js') && !item.endsWith('.test.js')) {
        try {
          delete require.cache[require.resolve(fullPath)];
          const mod = require(fullPath);
          if (this.register(mod, fullPath)) {
            count++;
          }
        } catch (err) {
          logger.warn(`[EVENT_LOADER] Error loading ${item}:`, err.message);
        }
      }
    }
    return count;
  }

  get(name) {
    return this.events.get(name.toLowerCase());
  }

  getAll() {
    return Array.from(this.events.values());
  }
}

module.exports = new EventManager();
