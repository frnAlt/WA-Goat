/**
 * Demote Command - Revoke admin privileges
 */

const groupService = require('../../services/groupService');

module.exports = {
  name: 'demote',
  aliases: ['admindel', 'unadmin'],
  category: 'admin',
  description: 'Demote mentioned or replied admins to normal members',
  usage: '{p}demote @user',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    const { chat, mentions, quoted, message } = extra;
    let targets = [];

    if (mentions && mentions.length > 0) {
      targets = mentions;
    } else if (quoted && quoted.sender) {
      targets = [quoted.sender];
    }

    if (targets.length === 0) {
      return await message.reply('👤 Please mention a user or reply to their message to demote.');
    }

    try {
      await groupService.demoteParticipants(sock, chat, targets);
      const usernames = targets.map(j => `@${j.split('@')[0]}`);
      await sock.sendMessage(chat, {
        text: `🔽 Demoted from admin: ${usernames.join(', ')}`,
        mentions: targets
      }, { quoted: msg });
    } catch (err) {
      await message.reply(`❌ Failed to demote user(s): ${err.message}`);
    }
  }
};
