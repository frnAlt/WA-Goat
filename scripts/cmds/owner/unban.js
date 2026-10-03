/**
 * Unban Command - Lift global bot ban
 */

const database = require('../../../src/database');

module.exports = {
  name: 'unban',
  aliases: ['unblockuser'],
  category: 'owner',
  description: 'Unban a user globally from using bot commands',
  usage: '{p}unban @user',
  ownerOnly: true,
  role: 2,

  async execute(sock, msg, args, extra) {
    const { mentions, quoted, message } = extra;
    let target = null;

    if (mentions && mentions.length > 0) target = mentions[0];
    else if (quoted && quoted.sender) target = quoted.sender;
    else if (args[0] && /^[0-9]+$/.test(args[0])) target = `${args[0]}@s.whatsapp.net`;

    if (!target) {
      return await message.reply('👤 Please mention a user or reply to their message to unban.');
    }

    const uNum = target.replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');
    database.unbanUser(uNum);

    await sock.sendMessage(extra.chat, {
      text: `✅ Global ban lifted for @${uNum}.`,
      mentions: [target]
    }, { quoted: msg });
  }
};
