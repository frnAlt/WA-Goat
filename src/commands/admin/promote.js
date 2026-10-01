/**
 * Promote Command - Grant admin privileges
 */

const groupService = require('../../services/groupService');

module.exports = {
  name: 'promote',
  aliases: ['adminadd', 'makeadmin'],
  category: 'admin',
  description: 'Promote mentioned or replied members to Group Admin',
  usage: '{p}promote @user',
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
      return await message.reply('👤 Please mention a user or reply to their message to promote.');
    }

    try {
      await groupService.promoteParticipants(sock, chat, targets);
      const usernames = targets.map(j => `@${j.split('@')[0]}`);
      await sock.sendMessage(chat, {
        text: `👑 Promoted to admin: ${usernames.join(', ')}`,
        mentions: targets
      }, { quoted: msg });
    } catch (err) {
      await message.reply(`❌ Failed to promote user(s): ${err.message}`);
    }
  }
};
