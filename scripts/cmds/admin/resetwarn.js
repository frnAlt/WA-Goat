/**
 * ResetWarn Command - Clear warnings for a member
 */

const database = require('../../../src/database');

module.exports = {
  name: 'resetwarn',
  aliases: ['clearwarn', 'unwarn'],
  category: 'admin',
  description: 'Reset warnings for a mentioned or replied member',
  usage: '{p}resetwarn @user',
  groupOnly: true,
  adminOnly: true,

  async execute(sock, msg, args, extra) {
    const { chat, mentions, quoted, message } = extra;
    let target = null;

    if (mentions && mentions.length > 0) {
      target = mentions[0];
    } else if (quoted && quoted.sender) {
      target = quoted.sender;
    }

    if (!target) {
      return await message.reply('👤 Please mention a user or reply to their message to reset warnings.');
    }

    database.resetWarnings(chat, target);
    const uNum = target.split('@')[0];

    await sock.sendMessage(chat, {
      text: `✅ Warnings reset to 0 for @${uNum}.`,
      mentions: [target]
    }, { quoted: msg });
  }
};
