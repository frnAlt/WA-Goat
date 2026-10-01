/**
 * Global Data Controller - Goat Bot V2 WhatsApp Edition
 */

const _ = require('lodash');
const path = require('path');
const { readJSONSafe, writeJSONSafeSync } = require('../safeStorage');

class GlobalData {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.resolve(process.cwd(), 'data/global.json');
    this.data = readJSONSafe(this.storagePath, {});
  }

  save() {
    writeJSONSafeSync(this.storagePath, this.data);
  }

  get(key, propPath, defaultValue = null) {
    if (!key) return defaultValue;
    if (!propPath) {
      return _.cloneDeep(this.data[key] !== undefined ? this.data[key] : defaultValue);
    }
    const val = this.data[key];
    if (val === undefined || val === null) return defaultValue;
    return _.cloneDeep(_.get(val, propPath, defaultValue));
  }

  set(key, value, propPath) {
    if (!key) return false;
    if (propPath) {
      if (!this.data[key] || typeof this.data[key] !== 'object') {
        this.data[key] = {};
      }
      _.set(this.data[key], propPath, value);
    } else {
      this.data[key] = value;
    }
    this.save();
    return _.cloneDeep(this.data[key]);
  }

  getAll() {
    return _.cloneDeep(this.data);
  }

  delete(key) {
    if (this.data[key] !== undefined) {
      delete this.data[key];
      this.save();
      return true;
    }
    return false;
  }
}

module.exports = GlobalData;
