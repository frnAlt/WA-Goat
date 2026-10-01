/**
 * Link Command - Get group invite link
 */

const groupService = require('../../services/groupService');

module.exports = {
  name: 'link',
  aliases: ['grouplink', 'glink', 'invitelink'],
  category: 'admin',
  description: 'Get the invite link for this group',
  usage: '{p}link',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    try {
      const code = await groupService.getInviteCode(sock, extra.chat);
      const inviteUrl = `https://chat.whatsapp.com/${code}`;
      await extra.message.reply(`🔗 *Group Invite Link:*\n${inviteUrl}`);
    } catch (err) {
      await extra.message.reply(`❌ Failed to retrieve invite link: ${err.message}`);
    }
  }
};
