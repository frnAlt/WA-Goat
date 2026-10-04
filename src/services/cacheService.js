/**
 * In-Memory Caching and TTL Management Service
 * Emulates Floppa-Chatbot's TTLMap and CooldownManager
 */

class TTLMap {
  constructor(options = {}) {
    this.ttl = options.ttl || 30 * 60 * 1000; // default 30 mins
    this.maxSize = options.maxSize || 500;
    this.cleanupInterval = options.cleanupInterval || 60 * 1000;
    this.map = new Map();

    this.timer = setInterval(() => this.cleanup(), this.cleanupInterval);
    if (this.timer.unref) this.timer.unref();
  }

  set(key, value, customTtl) {
    if (this.map.size >= this.maxSize) {
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
    const expiresAt = Date.now() + (customTtl || this.ttl);
    this.map.set(key, { value, expiresAt });
    return this;
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.map.entries()) {
      if (now > entry.expiresAt) {
        this.map.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.timer);
    this.map.clear();
  }
}

class CooldownManager {
  constructor() {
    this.cooldowns = new Map();
  }

  isOnCooldown(userId, commandName, cooldownSeconds) {
    if (!cooldownSeconds || cooldownSeconds <= 0) return 0;
    const key = `${userId}:${commandName}`;
    const now = Date.now();
    const expiry = this.cooldowns.get(key) || 0;

    if (now < expiry) {
      return Math.ceil((expiry - now) / 1000);
    }
    return 0;
  }

  setCooldown(userId, commandName, cooldownSeconds) {
    const key = `${userId}:${commandName}`;
    this.cooldowns.set(key, Date.now() + cooldownSeconds * 1000);
  }
}

const onReplyMap = new TTLMap({ ttl: 20 * 60 * 1000 });
const onReactionMap = new TTLMap({ ttl: 20 * 60 * 1000 });
const botSentMessages = new TTLMap({ ttl: 5 * 60 * 1000 });
const cooldownManager = new CooldownManager();

module.exports = {
  TTLMap,
  CooldownManager,
  onReplyMap,
  onReactionMap,
  botSentMessages,
  cooldownManager
};
