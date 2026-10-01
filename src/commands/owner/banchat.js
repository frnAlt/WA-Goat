/**
 * BanChat Command - Ban an entire group thread
 */

const database = require('../../database');

module.exports = {
  name: 'banchat',
  aliases: ['bangroup'],
  category: 'owner',
  description: 'Ban a group thread from bot execution',
  usage: '{p}banchat [reason]',
  ownerOnly: true,
  role: 2,
  groupOnly: true,

  async execute(sock, msg, args, extra) {
    const { chat, message } = extra;
    const reason = args.join(' ') || 'Banned by Bot Owner';
    database.banThread(chat, reason);
    await message.reply(`🚫 This group has been banned from using the bot.\nReason: *${reason}*`);
  }
};
