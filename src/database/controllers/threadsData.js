/**
 * Threads (Group Chats) Data Controller - Goat Bot V2 WhatsApp Edition
 */

const _ = require('lodash');
const path = require('path');
const config = require('../../config');
const { readJSONSafe, writeJSONSafeSync } = require('../safeStorage');

function normalizeThreadId(id) {
  if (!id) return '';
  const s = String(id).trim();
  if (s.endsWith('@g.us') || s.endsWith('@s.whatsapp.net')) return s;
  return s.includes('-') ? `${s}@g.us` : `${s}@s.whatsapp.net`;
}

class ThreadsData {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.resolve(process.cwd(), 'data/threads.json');
    this.threads = readJSONSafe(this.storagePath, {});
  }

  save() {
    writeJSONSafeSync(this.storagePath, this.threads);
  }

  create(threadID, defaultData = {}) {
    const id = normalizeThreadId(threadID);
    if (!id) return null;

    if (!this.threads[id]) {
      this.threads[id] = {
        threadID: id,
        threadName: defaultData.threadName || 'WhatsApp Group',
        isGroup: id.endsWith('@g.us'),
        prefix: defaultData.prefix || config.prefix,
        banned: false,
        banReason: '',
        bannedAt: null,
        settings: {
          ...config.defaultGroupSettings,
          ...(defaultData.settings || {})
        },
        data: {
          setRole: {},
          customWelcome: '',
          customGoodbye: '',
          warnings: {},
          disabledCommands: [],
          ...(defaultData.data || {})
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this.save();
    }
    return _.cloneDeep(this.threads[id]);
  }

  get(threadID, propPath, defaultValue = null) {
    const id = normalizeThreadId(threadID);
    if (!id) return defaultValue;
    const thread = this.threads[id] || this.create(id);
    if (!propPath) return _.cloneDeep(thread);
    return _.cloneDeep(_.get(thread, propPath, defaultValue));
  }

  set(threadID, data, propPath) {
    const id = normalizeThreadId(threadID);
    if (!id) return false;
    if (!this.threads[id]) this.create(id);

    if (propPath) {
      _.set(this.threads[id], propPath, data);
    } else if (typeof data === 'object') {
      this.threads[id] = { ...this.threads[id], ...data, updatedAt: Date.now() };
    }
    this.save();
    return _.cloneDeep(this.threads[id]);
  }

  getAll(filterFn) {
    const list = Object.values(this.threads);
    if (typeof filterFn === 'function') {
      return _.cloneDeep(list.filter(filterFn));
    }
    return _.cloneDeep(list);
  }

  remove(threadID) {
    const id = normalizeThreadId(threadID);
    if (this.threads[id]) {
      delete this.threads[id];
      this.save();
      return true;
    }
    return false;
  }

  exists(threadID) {
    const id = normalizeThreadId(threadID);
    return Boolean(this.threads[id]);
  }

  getSettings(threadID) {
    return this.get(threadID, 'settings', config.defaultGroupSettings);
  }

  updateSettings(threadID, newSettings) {
    const current = this.getSettings(threadID);
    const updated = { ...current, ...newSettings };
    this.set(threadID, updated, 'settings');
    return updated;
  }
}

module.exports = ThreadsData;
