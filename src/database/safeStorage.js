/**
 * Safe Atomic Storage for JSON files
 */

const fs = require('fs-extra');
const path = require('path');

function readJSONSafe(filePath, defaultValue = {}) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.ensureDirSync(path.dirname(filePath));
      fs.writeJsonSync(filePath, defaultValue, { spaces: 2 });
      return defaultValue;
    }
    return fs.readJsonSync(filePath);
  } catch (error) {
    console.error(`[STORAGE] Error reading ${filePath}:`, error.message);
    const backupPath = `${filePath}.corrupt.${Date.now()}`;
    try {
      if (fs.existsSync(filePath)) fs.copySync(filePath, backupPath);
      fs.writeJsonSync(filePath, defaultValue, { spaces: 2 });
    } catch (_) {}
    return defaultValue;
  }
}

function writeJSONSafeSync(filePath, data) {
  try {
    fs.ensureDirSync(path.dirname(filePath));
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeJsonSync(tempPath, data, { spaces: 2 });
    fs.moveSync(tempPath, filePath, { overwrite: true });
    return true;
  } catch (error) {
    console.error(`[STORAGE] Error writing ${filePath}:`, error.message);
    return false;
  }
}

async function writeJSONSafe(filePath, data) {
  try {
    await fs.ensureDir(path.dirname(filePath));
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    await fs.writeJson(tempPath, data, { spaces: 2 });
    await fs.move(tempPath, filePath, { overwrite: true });
    return true;
  } catch (error) {
    console.error(`[STORAGE] Async error writing ${filePath}:`, error.message);
    return false;
  }
}

module.exports = {
  readJSONSafe,
  writeJSONSafeSync,
  writeJSONSafe
};
