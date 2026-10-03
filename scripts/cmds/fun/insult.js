/**
 * Insult Command - Lighthearted funny burns
 */

const BURNS = [
  'I would agree with you, but then we would both be wrong.',
  'Your secrets are always safe with me. I never even listen when you talk.',
  'You have an entire life to be an idiot. Why not take today off?',
  'I am not insulting you; I am describing you.',
  'Somewhere out there, a tree is working tirelessly to produce oxygen for you. I think you owe it an apology.'
];

module.exports = {
  name: 'insult',
  aliases: ['roast', 'burn'],
  category: 'fun',
  description: 'Roast a friend with a funny burn',
  usage: '{p}insult @user',

  async execute(sock, msg, args, extra) {
    const { mentions, quoted, sender, chat } = extra;
    let target = sender;

    if (mentions && mentions.length > 0) target = mentions[0];
    else if (quoted && quoted.sender) target = quoted.sender;

    const uNum = target.split('@')[0];
    const burn = BURNS[Math.floor(Math.random() * BURNS.length)];

    await sock.sendMessage(chat, {
      text: `🔥 @${uNum}, ${burn}`,
      mentions: [target]
    }, { quoted: msg });
  }
};
