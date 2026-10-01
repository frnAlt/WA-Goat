/**
 * GroupInfo Command - Displays detailed group metadata
 */

const groupService = require('../../services/groupService');
const moment = require('moment-timezone');

module.exports = {
  name: 'groupinfo',
  aliases: ['ginfo', 'infogroup'],
  category: 'admin',
  description: 'Display detailed information and statistics about this group',
  usage: '{p}groupinfo',
  groupOnly: true,

  async execute(sock, msg, args, extra) {
    const { chat, message } = extra;
    const metadata = await groupService.getMetadata(sock, chat);
    if (!metadata) {
      return await message.reply('❌ Could not retrieve group metadata.');
    }

    const participants = metadata.participants || [];
    const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
    const owner = metadata.owner ? metadata.owner.split('@')[0] : 'Unknown';
    const createdAt = metadata.creation ? moment(metadata.creation * 1000).format('DD MMM YYYY, HH:mm') : 'Unknown';

    const info = `
*╭━━━〔 GROUP INFO 〕━━━╮*
*┃ 📛 Name:* ${metadata.subject}
*┃ 🆔 ID:* ${metadata.id}
*┃ 👑 Owner:* @${owner}
*┃ 👥 Members:* ${participants.length}
*┃ 🛡️ Admins:* ${admins.length}
*┃ 📅 Created:* ${createdAt}
*┃ 🔒 Muted:* ${metadata.announce ? 'Yes (Admins Only)' : 'No (Everyone)'}
*┃ 📝 Restricted Info:* ${metadata.restrict ? 'Yes' : 'No'}
*╰━━━━━━━━━━━━━━━━━━━━╯*

*📜 Description:*
${metadata.desc || 'No description provided.'}
`.trim();

    await sock.sendMessage(chat, {
      text: info,
      mentions: metadata.owner ? [metadata.owner] : []
    }, { quoted: msg });
  }
};
