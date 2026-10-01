/**
 * TagAll Command - Mention all group members
 */

const groupService = require('../../services/groupService');

module.exports = {
  name: 'tagall',
  aliases: ['everyone', 'all'],
  category: 'admin',
  description: 'Mention all members in the group with an optional message',
  usage: '{p}tagall [message]',
  groupOnly: true,
  adminOnly: true,

  async execute(sock, msg, args, extra) {
    const { chat, message } = extra;
    const metadata = await groupService.getMetadata(sock, chat);
    if (!metadata || !metadata.participants) {
      return await message.reply('❌ Could not retrieve group participant list.');
    }

    const participants = metadata.participants;
    const mentions = participants.map(p => p.id);
    const customMsg = args.join(' ') || 'Attention Everyone!';

    let text = `📢 *${customMsg}*\n\n`;
    for (let i = 0; i < participants.length; i++) {
      const uNum = participants[i].id.split('@')[0];
      text += `${i + 1}. @${uNum}\n`;
    }

    await sock.sendMessage(chat, { text, mentions }, { quoted: msg });
  }
};
