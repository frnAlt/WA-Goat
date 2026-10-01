/**
 * Mute Command - Lock group so only admins can send messages
 */

const groupService = require('../../services/groupService');

module.exports = {
  name: 'mute',
  aliases: ['close', 'lockgroup'],
  category: 'admin',
  description: 'Close group chat (only admins can send messages)',
  usage: '{p}mute',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    try {
      await groupService.setMute(sock, extra.chat, true);
      await extra.message.reply('🔒 Group has been muted. Only admins can send messages now.');
    } catch (err) {
      await extra.message.reply(`❌ Failed to mute group: ${err.message}`);
    }
  }
};
