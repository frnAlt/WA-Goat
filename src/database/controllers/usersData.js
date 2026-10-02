/**
 * Users Data Controller - Goat Bot V2 WhatsApp Edition
 */

const _ = require('lodash');
const path = require('path');
const { readJSONSafe, writeJSONSafeSync } = require('../safeStorage');

function normalizeId(id) {
  if (!id) return '';
  return String(id).replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');
}

class UsersData {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.resolve(process.cwd(), 'data/users.json');
    this.users = readJSONSafe(this.storagePath, {});
  }

  save() {
    writeJSONSafeSync(this.storagePath, this.users);
  }

  create(userID, defaultData = {}) {
    const id = normalizeId(userID);
    if (!id) return null;
    if (!this.users[id]) {
      this.users[id] = {
        userID: id,
        jid: `${id}@s.whatsapp.net`,
        name: defaultData.name || `User ${id}`,
        money: defaultData.money || 0,
        exp: defaultData.exp || 0,
        level: defaultData.level || 1,
        banned: false,
        banReason: '',
        bannedAt: null,
        premium: defaultData.premium || false,
        data: defaultData.data || {},
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this.save();
    }
    return _.cloneDeep(this.users[id]);
  }

  get(userID, propPath, defaultValue = null) {
    const id = normalizeId(userID);
    if (!id) return defaultValue;
    const user = this.users[id] || this.create(id);
    if (!propPath) return _.cloneDeep(user);
    return _.cloneDeep(_.get(user, propPath, defaultValue));
  }

  set(userID, data, propPath) {
    const id = normalizeId(userID);
    if (!id) return false;
    if (!this.users[id]) this.create(id);

    if (propPath) {
      _.set(this.users[id], propPath, data);
    } else if (typeof data === 'object') {
      this.users[id] = { ...this.users[id], ...data, updatedAt: Date.now() };
    }
    this.save();
    return _.cloneDeep(this.users[id]);
  }

  getAll(filterFn) {
    const list = Object.values(this.users);
    if (typeof filterFn === 'function') {
      return _.cloneDeep(list.filter(filterFn));
    }
    return _.cloneDeep(list);
  }

  remove(userID) {
    const id = normalizeId(userID);
    if (this.users[id]) {
      delete this.users[id];
      this.save();
      return true;
    }
    return false;
  }

  exists(userID) {
    const id = normalizeId(userID);
    return Boolean(this.users[id]);
  }

  addMoney(userID, amount) {
    const id = normalizeId(userID);
    const current = this.get(id, 'money', 0);
    const updated = Math.max(0, current + Number(amount));
    this.set(id, updated, 'money');
    return updated;
  }

  subtractMoney(userID, amount) {
    return this.addMoney(userID, -amount);
  }

  async getName(userID) {
    const id = normalizeId(userID);
    if (!id) return 'Unknown User';

    const user = this.users[id];
    if (user && user.name && user.name !== 'Unknown' && !user.name.startsWith('User ')) {
      return user.name;
    }

    try {
      const sock = global.floppaWca?.sock || global.wcaApi?.sock || global.api?.sock || global.ST?.api?.sock;
      if (sock) {
        const jid = `${id}@s.whatsapp.net`;
        const contacts = sock.contacts || (sock.store && sock.store.contacts) || {};
        const contact = contacts[jid] || contacts[id];
        const name = contact?.name || contact?.notify || contact?.verifiedName || contact?.pushName;
        if (name) {
          if (user) {
            user.name = name;
            this.save();
          }
          return name;
        }
      }
    } catch (_) {}

    return user?.name || `User ${id}`;
  }

  async getAvatarUrl(userID) {
    const id = normalizeId(userID);
    if (!id) return null;

    const jid = id.includes('@') ? id : `${id}@s.whatsapp.net`;

    try {
      const api = global.floppaWca || global.wcaApi || global.api || global.ST?.api;
      if (api && typeof api.getProfilePicture === 'function') {
        const pic = await api.getProfilePicture(jid);
        if (pic) return pic;
      }
    } catch (_) {}

    try {
      const sock = global.floppaWca?.sock || global.wcaApi?.sock || global.api?.sock || global.ST?.api?.sock;
      if (sock && typeof sock.profilePictureUrl === 'function') {
        const pic = await sock.profilePictureUrl(jid, 'image');
        if (pic) return pic;
      }
    } catch (_) {}

    const displayName = this.get(id, 'name', id);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=720`;
  }

  getItem(userID) {
    return this.get(userID);
  }

  getAllCache() {
    return this.getAll();
  }
}

module.exports = UsersData;
