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
        adminIDs: defaultData.adminIDs || [],
        members: defaultData.members || [],
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

  async getName(threadID) {
    const id = normalizeThreadId(threadID);
    if (!id) return 'WhatsApp Group';
    const thread = this.threads[id];
    if (thread && thread.threadName && thread.threadName !== 'WhatsApp Group') {
      return thread.threadName;
    }
    try {
      const api = global.floppaWca || global.wcaApi || global.api || global.ST?.api;
      if (api && typeof api.getThreadInfo === 'function') {
        const info = await api.getThreadInfo(id);
        if (info && (info.threadName || info.subject || info.name)) {
          const name = info.threadName || info.subject || info.name;
          if (thread) {
            thread.threadName = name;
            this.save();
          }
          return name;
        }
      }
    } catch (_) {}
    return thread?.threadName || 'WhatsApp Group';
  }

  getItem(threadID) {
    return this.get(threadID);
  }

  getAllCache() {
    return this.getAll();
  }

  async refreshInfo(threadID, info) {
    if (!info) return null;
    const id = normalizeThreadId(threadID);
    const thread = this.threads[id] || this.create(id);
    if (info.subject || info.name || info.threadName) {
      thread.threadName = info.subject || info.name || info.threadName;
    }
    if (Array.isArray(info.adminIDs)) {
      thread.adminIDs = info.adminIDs;
    }
    if (Array.isArray(info.participants) || Array.isArray(info.members)) {
      const list = info.participants || info.members;
      thread.members = list.map(p => {
        const uid = typeof p === 'object' ? (p.id || p.userID || p.jid) : p;
        return {
          userID: uid ? String(uid).replace(/@.*$/, '') : '',
          inGroup: true
        };
      });
    }
    thread.updatedAt = Date.now();
    this.save();
    return _.cloneDeep(thread);
  }

  async incrementMsgCount(threadID, userID) {
    const id = normalizeThreadId(threadID);
    const uId = String(userID || '').replace(/@.*$/, '');
    const current = this.get(id, `data.memberMsgCount.${uId}`, 0);
    this.set(id, current + 1, `data.memberMsgCount.${uId}`);
    return current + 1;
  }
}

module.exports = ThreadsData;
