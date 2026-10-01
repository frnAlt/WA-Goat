/**
 * Ship Command - Love Compatibility Calculator
 */

const { randomNumber } = require('../../utils/goatUtils');

module.exports = {
  name: 'ship',
  aliases: ['love', 'match'],
  category: 'fun',
  description: 'Calculate love compatibility between two members or yourself and someone',
  usage: '{p}ship @user1 [@user2]',

  async execute(sock, msg, args, extra) {
    const { mentions, sender, chat, message } = extra;

    let user1 = sender;
    let user2 = null;

    if (mentions.length >= 2) {
      user1 = mentions[0];
      user2 = mentions[1];
    } else if (mentions.length === 1) {
      user2 = mentions[0];
    }

    if (!user2) {
      return await message.reply('💘 Please mention someone to ship with!\nExample: *!ship @user*');
    }

    const u1 = user1.split('@')[0];
    const u2 = user2.split('@')[0];

    // Seeded random score based on IDs so it stays consistent
    const combined = parseInt(u1.slice(-4) || '1', 10) + parseInt(u2.slice(-4) || '1', 10);
    const score = (combined * 13) % 101;

    let verdict;
    if (score >= 90) verdict = 'Soulmates! Wedding bells are ringing! 💍❤️';
    else if (score >= 70) verdict = 'Great match! Lots of chemistry here! 💕';
    else if (score >= 50) verdict = 'Decent potential! Could work with effort. ✨';
    else if (score >= 30) verdict = 'Better off as casual acquaintances. 😅';
    else verdict = 'Total disaster! Run away fast! 🏃‍♂️💨';

    const barLength = 10;
    const filled = Math.round((score / 100) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

    const text = `
*╭━━━〔 ❤️ LOVE CALCULATOR 〕━━━╮*
*┃ 👤 Person 1 :* @${u1}
*┃ 👤 Person 2 :* @${u2}
*┃ 📊 Score    :* ${score}%
*┃ [${bar}]*
*╰━━━━━━━━━━━━━━━━━━━━━━━╯*

*Verdict:* ${verdict}
`.trim();

    await sock.sendMessage(chat, {
      text,
      mentions: [user1, user2]
    }, { quoted: msg });
  }
};
