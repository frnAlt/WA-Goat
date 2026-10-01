/**
 * Kick Command - Remove members from group
 */

const groupService = require('../../services/groupService');
const { decodeJid } = require('../../utils/myfunc');

module.exports = {
  name: 'kick',
  aliases: ['remove', 'expel'],
  category: 'admin',
  description: 'Remove mentioned or replied members from the group',
  usage: '{p}kick @user (or reply to user message)',
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
    } else if (args[0] && /^[0-9]+$/.test(args[0])) {
      targets = [`${args[0]}@s.whatsapp.net`];
    }

    if (targets.length === 0) {
      return await message.reply('👤 Please mention a user or reply to their message to kick.');
    }

    const botId = decodeJid(sock.user?.id);
    if (targets.some(t => decodeJid(t) === botId)) {
      return await message.reply('❌ I cannot kick myself!');
    }

    try {
      await groupService.removeParticipants(sock, chat, targets);
      const usernames = targets.map(j => `@${j.split('@')[0]}`);
      await sock.sendMessage(chat, {
        text: `👢 ${usernames.join(', ')} has been removed from the group.`,
        mentions: targets
      }, { quoted: msg });
    } catch (err) {
      await message.reply(`❌ Failed to remove user(s): ${err.message}`);
    }
  }
};
