/**
 * Dynamic Command Loader and Registry
 * Supports both GoatBot format and WhatsApp/KnightBot format
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class CommandManager {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
    this.categories = new Map();

    const config = require('../config');
    const { usersData, threadsData, globalData } = require('../database');
    global.controllers = {
      Users: usersData,
      Threads: threadsData,
      Global: globalData
    };
    global.GoatBot = global.GoatBot || {
      config,
      commands: this.commands,
      aliases: this.aliases,
      onReply: new Map(),
      onReaction: new Map()
    };
    if (!global.utils) {
      try {
        global.utils = require(path.resolve(process.cwd(), 'utils.js'));
      } catch (_) {
        global.utils = require('../utils/goatUtils');
      }
    }
  }

  /**
   * Register a single command module
   */
  register(rawCommand, sourceFile = '') {
    if (!rawCommand) return false;

    // Support ES module default or CommonJS
    const command = rawCommand.default && (rawCommand.default.config || rawCommand.default.name || rawCommand.default.onCall || rawCommand.default.onStart)
      ? rawCommand.default
      : rawCommand;

    const meta = command.meta || rawCommand.meta || null;
    const config = command.config || rawCommand.config || null;

    // Normalize GoatBot, KnightBot, Xavia, and Meta formats
    let name = command.name || config?.name || meta?.name;
    if (!name) return false;
    name = String(name).toLowerCase().trim();

    const rawAliases = command.aliases || config?.aliases || meta?.aliases || [];
    const aliases = (Array.isArray(rawAliases) ? rawAliases : [rawAliases]).map(a => String(a).toLowerCase().trim());
    const category = String(command.category || config?.category || meta?.category || 'general').toLowerCase().trim();
    const description = command.description || config?.description?.en || config?.description || meta?.description || 'No description';
    const usage = command.usage || config?.guide?.en || config?.guide || config?.usage || meta?.usage || `{p}${name}`;
    const cooldown = command.cooldown || config?.countDown || config?.cooldown || meta?.waitingTime || 3;
    const role = command.role !== undefined ? command.role : (config?.role !== undefined ? config.role : (meta?.role !== undefined ? meta.role : 0));

    // Flags
    const groupOnly = Boolean(command.groupOnly || config?.groupOnly || meta?.groupOnly);
    const adminOnly = Boolean(command.adminOnly || role === 1);
    const ownerOnly = Boolean(command.ownerOnly || role >= 2);
    const botAdminNeeded = Boolean(command.botAdminNeeded);

    const cmdObj = {
      name,
      aliases,
      category,
      description,
      usage,
      cooldown,
      role,
      groupOnly,
      adminOnly,
      ownerOnly,
      botAdminNeeded,
      sourceFile,
      raw: rawCommand,

      // Unified execute method
      async execute(ctx) {
        const { usersData, threadsData, globalData } = require('../database');
        global.controllers = {
          Users: usersData,
          Threads: threadsData,
          Global: globalData
        };

        const getLang = (key, ...args) => {
          let str = command.langs?.en?.[key] || (command.langData?.en_US?.[key] || key);
          if (args.length > 0 && typeof str === 'string') {
            args.forEach((val, idx) => {
              str = str.replace(new RegExp(`%${idx + 1}`, 'g'), String(val));
            });
          }
          return str;
        };

        const baseWca = global.floppaWca || global.wcaApi || global.api || {};
        const apiShim = {
          ...baseWca,
          ...ctx.sock,
          getCurrentUserID: () => {
            if (typeof baseWca.getCurrentUserID === 'function') return baseWca.getCurrentUserID();
            return ctx.sock?.user?.id?.replace(/:.*@/, '@') || ctx.sock?.user?.id || '';
          },
          getProfilePicture: async (jid) => {
            const targetJid = jid || ctx.chat;
            if (typeof baseWca.getProfilePicture === 'function') {
              try {
                const pic = await baseWca.getProfilePicture(targetJid);
                if (pic) return pic;
              } catch (_) {}
            }
            try {
              return await ctx.sock.profilePictureUrl(targetJid, 'image');
            } catch (_) {
              return null;
            }
          },
          sendMessage: async (form, threadID, arg3, arg4) => {
            const callback = typeof arg3 === 'function' ? arg3 : typeof arg4 === 'function' ? arg4 : null;
            const quoteRef = typeof arg3 === 'string' ? arg3 : typeof arg4 === 'string' ? arg4 : null;
            const dest = threadID || ctx.chat;
            const opts = {};
            if (quoteRef) {
              opts.quoted = { key: { remoteJid: dest, id: quoteRef, fromMe: false } };
            }
            try {
              let res;
              if (global.wcaApi && typeof global.wcaApi.sendMessage === 'function') {
                res = await global.wcaApi.sendMessage(form, dest, callback, opts);
              } else {
                res = await ctx.message.sendTo(dest, form, opts, callback);
              }
              return res;
            } catch (err) {
              if (typeof callback === 'function') callback(err, null);
              throw err;
            }
          },
          sendImage: async (url, threadID, caption = '', options = {}, callback) => {
            if (typeof baseWca.sendImage === 'function') {
              return await baseWca.sendImage(url, threadID || ctx.chat, caption, options, callback);
            }
            return await ctx.message.sendTo(threadID || ctx.chat, { body: caption, attachment: url }, options, callback);
          },
          sendVideo: async (url, threadID, caption = '', options = {}, callback) => {
            if (typeof baseWca.sendVideo === 'function') {
              return await baseWca.sendVideo(url, threadID || ctx.chat, caption, options, callback);
            }
            return await ctx.message.sendTo(threadID || ctx.chat, { body: caption, attachment: url }, options, callback);
          },
          sendAudio: async (url, threadID, isVoice = false, options = {}, callback) => {
            if (typeof baseWca.sendAudio === 'function') {
              return await baseWca.sendAudio(url, threadID || ctx.chat, isVoice, options, callback);
            }
            return await ctx.message.sendTo(threadID || ctx.chat, { attachment: url }, options, callback);
          },
          sendDocument: async (url, threadID, fileName = 'file', mimetype = 'application/octet-stream', options = {}, callback) => {
            if (typeof baseWca.sendDocument === 'function') {
              return await baseWca.sendDocument(url, threadID || ctx.chat, fileName, mimetype, options, callback);
            }
            return await ctx.message.sendTo(threadID || ctx.chat, { attachment: url, mimetype, fileName }, options, callback);
          },
          downloadMedia: async (msg) => {
            if (typeof baseWca.downloadMedia === 'function') {
              return await baseWca.downloadMedia(msg);
            }
            const { downloadMediaMessage } = require('@whiskeysockets/baileys');
            const targetMsg = msg?.raw || msg;
            return await downloadMediaMessage(targetMsg, 'buffer', {});
          },
          reactToMessage: async (threadID, key, emoji) => {
            const dest = threadID || ctx.chat;
            const reactionKey = key?.id ? key : { remoteJid: dest, id: key || ctx.messageID, fromMe: false };
            if (typeof baseWca.reactToMessage === 'function') {
              return await baseWca.reactToMessage(dest, reactionKey, emoji);
            }
            return await ctx.sock.sendMessage(dest, { react: { text: emoji || '', key: reactionKey } }).catch(() => {});
          },
          deleteMessage: async (threadID, key, everyone = true) => {
            const dest = threadID || ctx.chat;
            const delKey = key?.id ? key : { remoteJid: dest, id: key || ctx.messageID, fromMe: true };
            if (typeof baseWca.deleteMessage === 'function') {
              return await baseWca.deleteMessage(dest, delKey, everyone);
            }
            return await ctx.sock.sendMessage(dest, { delete: delKey }).catch(() => {});
          },
          editMessage: async (threadID, msgID, newText) => {
            const dest = threadID || ctx.chat;
            if (typeof baseWca.editMessage === 'function') {
              return await baseWca.editMessage(dest, msgID, newText);
            }
            return await ctx.sock.sendMessage(dest, { text: newText, edit: { remoteJid: dest, id: msgID, fromMe: true } }).catch(() => {});
          },
          sendTypingIndicator: async (status, threadID) => {
            const dest = threadID || ctx.chat;
            await ctx.sock.sendPresenceUpdate(status ? 'composing' : 'paused', dest).catch(() => {});
          },
          unsendMessage: async (messageID, threadID, callback) => {
            const dest = threadID || ctx.chat;
            try {
              const res = await ctx.sock.sendMessage(dest, { delete: { remoteJid: dest, id: messageID, fromMe: true } }).catch(() => {});
              if (typeof callback === 'function') callback(null, res);
              return res;
            } catch (err) {
              if (typeof callback === 'function') callback(err, null);
            }
          },
          setMessageReaction: async (emoji, messageID, callback) => {
            try {
              const dest = ctx.chat;
              const mid = messageID || ctx.messageID;
              const res = await ctx.sock.sendMessage(dest, {
                react: {
                  text: emoji || '',
                  key: { remoteJid: dest, id: mid, fromMe: false }
                }
              }).catch(() => {});
              if (typeof callback === 'function') callback(null, res);
              return res;
            } catch (err) {
              if (typeof callback === 'function') callback(err, null);
            }
          },
          getUserInfo: async (userID, callback) => {
            try {
              const data = await usersData.get(userID);
              if (typeof callback === 'function') callback(null, { [userID]: data });
              return { [userID]: data };
            } catch (err) {
              if (typeof callback === 'function') callback(err, null);
            }
          },
          getThreadInfo: async (threadID, callback) => {
            try {
              const data = await threadsData.get(threadID);
              if (typeof callback === 'function') callback(null, data);
              return data;
            } catch (err) {
              if (typeof callback === 'function') callback(err, null);
            }
          }
        };

        if (typeof command.execute === 'function') {
          return await command.execute(ctx.sock, ctx.m, ctx.args, ctx);
        } else if (typeof command.onStart === 'function') {
          return await command.onStart({
            api: apiShim,
            sock: ctx.sock,
            message: ctx.message,
            args: ctx.args,
            usersData,
            threadsData,
            globalData,
            event: ctx,
            getLang,
            extra: ctx,
            prefix: ctx.prefix || require('../config').prefix || '!',
            commandName: ctx.commandName || name,
            config: require('../config'),
            envCommands: {},
            role: ctx.isOwner ? 4 : ctx.isBotAdmin ? 2 : ctx.isAdmin ? 1 : 0
          });
        } else if (typeof command.onCall === 'function') {
          return await command.onCall({
            api: apiShim,
            sock: ctx.sock,
            message: ctx.message,
            args: ctx.args,
            getLang,
            extra: config?.extra || {},
            event: ctx,
            data: {},
            user: ctx.sender,
            thread: ctx.chat
          });
        } else if (typeof rawCommand.entry === 'function' || typeof command.entry === 'function') {
          const entryFn = rawCommand.entry || command.entry;
          return await entryFn({
            input: {
              arguments: ctx.args,
              text: ctx.body,
              raw: ctx.raw
            },
            output: {
              reply: (msg) => ctx.message.reply(msg),
              send: (msg) => ctx.message.send(msg)
            },
            event: ctx
          });
        } else if (typeof command === 'function') {
          return await command(ctx.sock, ctx.chat, ctx.m, ctx.args);
        }
        throw new Error(`Command "${name}" has no executable method.`);
      }
    };

    this.commands.set(name, cmdObj);

    // Register aliases
    for (const alias of aliases) {
      this.aliases.set(alias, name);
    }

    // Register categories
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category).push(name);

    return true;
  }

  /**
   * Load all commands from directory recursively
   */
  loadFromDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return 0;

    let count = 0;
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.resolve(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        count += this.loadFromDirectory(fullPath);
      } else if (item.endsWith('.js') && !item.endsWith('.test.js')) {
        try {
          delete require.cache[require.resolve(fullPath)];
          const mod = require(fullPath);
          if (this.register(mod, fullPath)) {
            count++;
          }
        } catch (err) {
          logger.warn(`[COMMAND_LOADER] Error loading ${item}:`, err.message);
        }
      }
    }

    return count;
  }

  /**
   * Find a command by name or alias
   */
  get(nameOrAlias) {
    if (!nameOrAlias) return null;
    const clean = nameOrAlias.toLowerCase().trim();
    if (this.commands.has(clean)) {
      return this.commands.get(clean);
    }
    if (this.aliases.has(clean)) {
      const canonical = this.aliases.get(clean);
      return this.commands.get(canonical);
    }
    return null;
  }

  /**
   * Get all registered commands
   */
  getAll() {
    return Array.from(this.commands.values());
  }

  /**
   * Get category map
   */
  getCategories() {
    return this.categories;
  }
}

module.exports = new CommandManager();
