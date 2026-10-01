/**
 * Staff Command - List Group Admins and Staff
 */

const groupService = require('../../services/groupService');

module.exports = {
  name: 'staff',
  aliases: ['admins', 'adminlist'],
  category: 'utility',
  description: 'List all group admins and staff members',
  usage: '{p}staff',
  groupOnly: true,

  async execute(sock, msg, args, extra) {
    const { chat, message } = extra;
    const metadata = await groupService.getMetadata(sock, chat);
    if (!metadata || !metadata.participants) {
      return await message.reply('❌ Could not retrieve group staff list.');
    }

    const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
    if (admins.length === 0) {
      return await message.reply('ℹ️ No admins found in this group.');
    }

    let text = `🛡️ *GROUP STAFF & ADMINS (${admins.length})*\n\n`;
    const mentions = [];

    admins.forEach((a, i) => {
      const roleBadge = a.admin === 'superadmin' ? '👑 Owner/SuperAdmin' : '⭐ Admin';
      const uNum = a.id.split('@')[0];
      mentions.push(a.id);
      text += `${i + 1}. @${uNum} — *${roleBadge}*\n`;
    });

    await sock.sendMessage(chat, { text: text.trim(), mentions }, { quoted: msg });
  }
};
