/**
 * Ban Command - Ban user globally from the bot
 */

const database = require('../../database');
const config = require('../../config');

module.exports = {
  name: 'ban',
  aliases: ['blockuser', 'botban'],
  category: 'owner',
  description: 'Ban a user globally from using any bot commands',
  usage: '{p}ban @user [reason]',
  ownerOnly: true,
  role: 2,

  async execute(sock, msg, args, extra) {
    const { mentions, quoted, message } = extra;
    let target = null;

    if (mentions && mentions.length > 0) target = mentions[0];
    else if (quoted && quoted.sender) target = quoted.sender;
    else if (args[0] && /^[0-9]+$/.test(args[0])) target = `${args[0]}@s.whatsapp.net`;

    if (!target) {
      return await message.reply('👤 Please mention a user or reply to their message to ban.');
    }

    const uNum = target.replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');
    if (uNum === config.ownerNumber) {
      return await message.reply('❌ You cannot ban the bot owner!');
    }

    const reason = args.slice(mentions.length > 0 ? 1 : 0).join(' ') || 'Violating bot policies';
    database.banUser(uNum, reason);

    await sock.sendMessage(extra.chat, {
      text: `🚫 @${uNum} has been globally *BANNED* from using the bot.\nReason: *${reason}*`,
      mentions: [target]
    }, { quoted: msg });
  }
};
