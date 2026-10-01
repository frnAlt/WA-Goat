/**
 * Revoke Command - Reset group invite link
 */

const groupService = require('../../services/groupService');

module.exports = {
  name: 'revoke',
  aliases: ['resetlink', 'newlink'],
  category: 'admin',
  description: 'Revoke and reset the group invite link',
  usage: '{p}revoke',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    try {
      const newCode = await groupService.revokeInviteCode(sock, extra.chat);
      const newUrl = `https://chat.whatsapp.com/${newCode}`;
      await extra.message.reply(`🔄 Previous link revoked! New invite link:\n${newUrl}`);
    } catch (err) {
      await extra.message.reply(`❌ Failed to revoke invite link: ${err.message}`);
    }
  }
};
