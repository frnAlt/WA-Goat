/**
 * TopMembers Command - Leaderboard of wealthiest members
 */

const database = require('../../database');
const groupService = require('../../services/groupService');

module.exports = {
  name: 'topmembers',
  aliases: ['leaderboard', 'top'],
  category: 'utility',
  description: 'View the leaderboard of the richest members in the group or globally',
  usage: '{p}topmembers',

  async execute(sock, msg, args, extra) {
    const { chat, isGroup, message } = extra;
    let users = database.usersData.getAll();

    if (isGroup) {
      const metadata = await groupService.getMetadata(sock, chat);
      const participantNums = (metadata?.participants || []).map(p => p.id.replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, ''));
      users = users.filter(u => participantNums.includes(u.userID));
    }

    users.sort((a, b) => (b.money || 0) - (a.money || 0));
    const top10 = users.slice(0, 10);

    if (top10.length === 0) {
      return await message.reply('ℹ️ No member data recorded yet.');
    }

    let text = `🏆 *TOP 10 RICHEST MEMBERS* 🏆\n\n`;
    const mentions = [];

    top10.forEach((u, i) => {
      const medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : `${i + 1}.`));
      const jid = `${u.userID}@s.whatsapp.net`;
      mentions.push(jid);
      text += `${medal} @${u.userID} — *$${(u.money || 0).toLocaleString()}*\n`;
    });

    await sock.sendMessage(chat, { text: text.trim(), mentions }, { quoted: msg });
  }
};
