/**
 * Unmute Command - Unlock group so all members can send messages
 */

const groupService = require('../../services/groupService');

module.exports = {
  name: 'unmute',
  aliases: ['open', 'unlockgroup'],
  category: 'admin',
  description: 'Open group chat (all members can send messages)',
  usage: '{p}unmute',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    try {
      await groupService.setMute(sock, extra.chat, false);
      await extra.message.reply('🔓 Group has been unmuted. All members can send messages now.');
    } catch (err) {
      await extra.message.reply(`❌ Failed to unmute group: ${err.message}`);
    }
  }
};
