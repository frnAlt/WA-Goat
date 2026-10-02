/**
 * WhatsApp Web Access Token & Session Manager (wa_web.json / account.txt)
 * Bridges token-based headless authentication with Baileys v7 MultiFileAuthState.
 *
 * Supported formats:
 *  - wa_web_access_token strings (e.g. WA_WEB~<base64> or raw base64)
 *  - wa_web.json (object with wa_web_access_token or full creds JSON)
 *  - account.txt / acc.txt (legacy Floppa-bot style token/creds file)
 *  - WA_WEB_ACCESS_TOKEN / SESSION_ID environment variables
 *
 * @author frnAlt
 */

const fs = require('fs-extra');
const path = require('path');
const { BufferJSON } = require('@whiskeysockets/baileys');

/**
 * Clean & extract JSON from a raw string or base64 token
 */
function parseWaWebToken(input) {
  if (!input) return null;

  // Case 1: Plain JS object
  if (typeof input === 'object' && input !== null) {
    if (input.wa_web_access_token || input.token || input.session) {
      return parseWaWebToken(input.wa_web_access_token || input.token || input.session);
    }
    if (input.creds && typeof input.creds === 'object') {
      return { creds: input.creds, keys: input.keys || null, raw: JSON.stringify(input) };
    }
    if (input.noiseKey || input.registrationId || input.signedIdentityKey) {
      return { creds: input, keys: input.keys || null, raw: JSON.stringify(input) };
    }
    return null;
  }

  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Case 2: JSON string format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed, BufferJSON.reviver);
      if (parsed.wa_web_access_token || parsed.token || parsed.session) {
        return parseWaWebToken(parsed.wa_web_access_token || parsed.token || parsed.session);
      }
      if (parsed.creds && typeof parsed.creds === 'object') {
        return { creds: parsed.creds, keys: parsed.keys || null, raw: trimmed };
      }
      if (parsed.noiseKey || parsed.registrationId || parsed.signedIdentityKey) {
        return { creds: parsed, keys: parsed.keys || null, raw: trimmed };
      }
    } catch (_) {}
  }

  // Case 3: Base64 token with optional prefix (e.g. WA_WEB~..., GoatBot~..., Session~...)
  const prefixRegex = /^(WA_WEB~|WA~|GoatBot~|Session~|session_|token_|floppa_|wa_web_)/i;
  const cleanBase64 = trimmed.replace(prefixRegex, '').replace(/\s+/g, '');

  try {
    const decodedStr = Buffer.from(cleanBase64, 'base64').toString('utf8');
    if (decodedStr.startsWith('{') && decodedStr.endsWith('}')) {
      const parsed = JSON.parse(decodedStr, BufferJSON.reviver);
      if (parsed.wa_web_access_token || parsed.token) {
        return parseWaWebToken(parsed.wa_web_access_token || parsed.token);
      }
      if (parsed.creds && typeof parsed.creds === 'object') {
        return { creds: parsed.creds, keys: parsed.keys || null, raw: trimmed };
      }
      if (parsed.noiseKey || parsed.registrationId || parsed.signedIdentityKey) {
        return { creds: parsed, keys: parsed.keys || null, raw: trimmed };
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Generate a standalone base64 wa_web_access_token from creds & keys
 */
function encodeWaWebToken(creds, keys = null) {
  if (!creds) return '';
  const payload = keys ? { creds, keys } : { creds };
  const jsonStr = JSON.stringify(payload, BufferJSON.replacer);
  const base64 = Buffer.from(jsonStr, 'utf8').toString('base64');
  return `WA_WEB~${base64}`;
}

/**
 * Apply token / credentials to session directory (auth/creds.json)
 */
async function applyWaWebToken(tokenOrContent, sessionDir, options = {}) {
  const parsed = parseWaWebToken(tokenOrContent);
  if (!parsed || !parsed.creds) {
    return {
      success: false,
      error: 'Invalid WhatsApp Web access token or credentials structure'
    };
  }

  await fs.ensureDir(sessionDir);
  const credsPath = path.join(sessionDir, 'creds.json');

  // Write creds.json with Baileys BufferJSON replacer
  const credsJson = JSON.stringify(parsed.creds, BufferJSON.replacer, 2);
  await fs.writeFile(credsPath, credsJson, 'utf8');

  // If signal keys were included in token payload, write them as well
  if (parsed.keys && typeof parsed.keys === 'object') {
    for (const [keyName, keyVal] of Object.entries(parsed.keys)) {
      const keyFile = path.join(sessionDir, `${keyName}.json`);
      await fs.writeFile(keyFile, JSON.stringify(keyVal, BufferJSON.replacer, 2), 'utf8');
    }
  }

  const token = encodeWaWebToken(parsed.creds, parsed.keys);

  // Sync wa_web.json in project root
  if (options.syncRootFiles !== false) {
    try {
      const waWebPath = path.resolve(process.cwd(), 'wa_web.json');
      const waWebData = {
        wa_web_access_token: token,
        platform: parsed.creds.platform || 'whatsapp-web',
        registered: Boolean(parsed.creds.registered),
        me: parsed.creds.me || null,
        updatedAt: new Date().toISOString(),
        creds: parsed.creds
      };
      await fs.writeJson(waWebPath, waWebData, { spaces: 2, replacer: BufferJSON.replacer });
    } catch (_) {}

    // Sync account.txt for Floppa bot backward compatibility
    try {
      const accPath = path.resolve(process.cwd(), 'account.txt');
      await fs.writeFile(accPath, token, 'utf8');
    } catch (_) {}
  }

  return {
    success: true,
    creds: parsed.creds,
    token
  };
}

/**
 * Check if sessionDir already has a registered, valid creds.json
 */
async function hasValidSession(sessionDir) {
  try {
    const credsPath = path.join(sessionDir, 'creds.json');
    if (!await fs.pathExists(credsPath)) return false;
    const raw = await fs.readFile(credsPath, 'utf8');
    const creds = JSON.parse(raw, BufferJSON.reviver);
    return Boolean(creds && creds.registered && creds.me);
  } catch (_) {
    return false;
  }
}

/**
 * Restore WhatsApp Web session from wa_web.json, account.txt, or env
 * Called on startup before useMultiFileAuthState initializes
 */
async function restoreWaWebSession(sessionDir, options = {}) {
  const force = options.force || false;

  if (!force && await hasValidSession(sessionDir)) {
    return { restored: false, reason: 'Valid active session already exists' };
  }

  const candidateSources = [
    { name: 'env:WA_WEB_ACCESS_TOKEN', content: process.env.WA_WEB_ACCESS_TOKEN },
    { name: 'env:SESSION_ID', content: process.env.SESSION_ID },
    { name: 'config:waWebAccessToken', content: options.configToken },
    { name: 'file:wa_web.json', path: path.resolve(process.cwd(), 'wa_web.json') },
    { name: 'file:account.txt', path: path.resolve(process.cwd(), 'account.txt') },
    { name: 'file:acc.txt', path: path.resolve(process.cwd(), 'acc.txt') }
  ];

  for (const src of candidateSources) {
    let rawContent = src.content;
    if (!rawContent && src.path && await fs.pathExists(src.path)) {
      try {
        rawContent = await fs.readFile(src.path, 'utf8');
      } catch (_) {}
    }

    if (rawContent && typeof rawContent === 'string' && rawContent.trim().length > 10) {
      const res = await applyWaWebToken(rawContent, sessionDir, { syncRootFiles: options.syncRootFiles !== false });
      if (res.success) {
        return {
          restored: true,
          source: src.name,
          me: res.creds?.me || null,
          token: res.token
        };
      }
    }
  }

  return { restored: false, reason: 'No valid token or credential file found' };
}

/**
 * Export current active session in sessionDir to wa_web.json and account.txt
 */
async function exportWaWebToken(sessionDir, options = {}) {
  try {
    const credsPath = path.join(sessionDir, 'creds.json');
    if (!await fs.pathExists(credsPath)) return null;

    const raw = await fs.readFile(credsPath, 'utf8');
    const creds = JSON.parse(raw, BufferJSON.reviver);
    if (!creds) return null;

    const token = encodeWaWebToken(creds);

    let waWebPath = null;
    let accPath = null;

    if (options.syncRootFiles !== false) {
      // Save wa_web.json
      waWebPath = path.resolve(process.cwd(), 'wa_web.json');
      const waWebData = {
        wa_web_access_token: token,
        platform: creds.platform || 'whatsapp-web',
        registered: Boolean(creds.registered),
        me: creds.me || null,
        updatedAt: new Date().toISOString(),
        creds
      };
      await fs.writeJson(waWebPath, waWebData, { spaces: 2, replacer: BufferJSON.replacer });

      // Save account.txt
      accPath = path.resolve(process.cwd(), 'account.txt');
      await fs.writeFile(accPath, token, 'utf8');
    }

    return {
      token,
      creds,
      waWebPath,
      accPath
    };
  } catch (err) {
    return null;
  }
}

/**
 * Read current session content for dashboard or CLI display
 */
async function readWaWebSessionContent(sessionDir) {
  // 1. wa_web.json
  const waWebPath = path.resolve(process.cwd(), 'wa_web.json');
  if (await fs.pathExists(waWebPath)) {
    try {
      const content = await fs.readFile(waWebPath, 'utf8');
      if (content.trim()) return content;
    } catch (_) {}
  }

  // 2. account.txt
  const accPath = path.resolve(process.cwd(), 'account.txt');
  if (await fs.pathExists(accPath)) {
    try {
      const content = await fs.readFile(accPath, 'utf8');
      if (content.trim()) return content;
    } catch (_) {}
  }

  // 3. active creds.json
  if (sessionDir) {
    const credsPath = path.join(sessionDir, 'creds.json');
    if (await fs.pathExists(credsPath)) {
      try {
        const raw = await fs.readFile(credsPath, 'utf8');
        const creds = JSON.parse(raw, BufferJSON.reviver);
        const token = encodeWaWebToken(creds);
        return JSON.stringify({ wa_web_access_token: token, creds }, null, 2);
      } catch (_) {}
    }
  }

  return '';
}

module.exports = {
  parseWaWebToken,
  encodeWaWebToken,
  applyWaWebToken,
  restoreWaWebSession,
  exportWaWebToken,
  readWaWebSessionContent,
  hasValidSession
};
