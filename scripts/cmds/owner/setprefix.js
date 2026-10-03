/**
 * SetPrefix Command - Change bot prefix globally or per group
 */

const config = require('../../../src/config');
const database = require('../../../src/database');

module.exports = {
  name: 'setprefix',
  aliases: ['prefix', 'changeprefix'],
  category: 'owner',
  description: 'Change command prefix (globally or for the current group)',
  usage: '{p}setprefix <new prefix> [group|global]',
  role: 2,

  async execute(sock, msg, args, extra) {
    const { isGroup, chat, isOwner, message } = extra;
    const newPrefix = args[0];

    if (!newPrefix) {
      const current = isGroup ? database.threadsData.get(chat, 'prefix', config.prefix) : config.prefix;
      return await message.reply(`Current prefix is: *${current}*\nUsage: *${current}setprefix <new prefix>*`);
    }

    if (newPrefix.length > 3) {
      return await message.reply('⚠️ Prefix cannot be longer than 3 characters.');
    }

    const scope = (args[1] || (isGroup ? 'group' : 'global')).toLowerCase();

    if (scope === 'global') {
      if (!isOwner) return await message.reply('👑 Only the bot owner can change the global prefix.');
      config.prefix = newPrefix;
      return await message.reply(`✅ Global prefix changed to: *${newPrefix}*`);
    }

    if (isGroup) {
      database.threadsData.set(chat, newPrefix, 'prefix');
      return await message.reply(`✅ Prefix for this group changed to: *${newPrefix}*`);
    }

    config.prefix = newPrefix;
    await message.reply(`✅ Prefix changed to: *${newPrefix}*`);
  }
};
