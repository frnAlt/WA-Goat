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
  }

  /**
   * Register a single command module
   */
  register(command, sourceFile = '') {
    if (!command) return false;

    // Normalize GoatBot format vs KnightBot format
    let name = command.name || command.config?.name;
    if (!name) return false;
    name = name.toLowerCase().trim();

    const aliases = (command.aliases || command.config?.aliases || []).map(a => a.toLowerCase().trim());
    const category = (command.category || command.config?.category || 'general').toLowerCase().trim();
    const description = command.description || command.config?.description?.en || command.config?.description || 'No description';
    const usage = command.usage || command.config?.guide?.en || command.config?.guide || `{p}${name}`;
    const cooldown = command.cooldown || command.config?.countDown || 3;
    const role = command.role !== undefined ? command.role : (command.config?.role !== undefined ? command.config.role : 0);

    // Flags
    const groupOnly = Boolean(command.groupOnly || command.config?.groupOnly);
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
      raw: command,

      // Unified execute method
      async execute(ctx) {
        if (typeof command.execute === 'function') {
          return await command.execute(ctx.sock, ctx.m, ctx.args, ctx);
        } else if (typeof command.onStart === 'function') {
          const { usersData, threadsData, globalData } = require('../database');
          const getLang = (key) => command.langs?.en?.[key] || key;
          return await command.onStart({
            sock: ctx.sock,
            message: ctx.message,
            args: ctx.args,
            usersData,
            threadsData,
            globalData,
            event: ctx,
            getLang,
            extra: ctx,
            config: require('../config')
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
      const fullPath = path.join(dirPath, item);
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
