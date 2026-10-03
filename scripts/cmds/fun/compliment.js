/**
 * Compliment Command - Send wholesome compliments
 */

const COMPLIMENTS = [
  'You have an infectious positive energy that brightens the room!',
  'Your creative perspective always brings something unique to the table.',
  'You are more capable than you know, and your kindness is unmatched.',
  'If cartoon bluebirds were real, a couple of them would be sitting on your shoulders right now.',
  'You are like a breath of fresh air on a warm summer day.',
  'You have a great sense of humor and you make people feel valued.'
];

module.exports = {
  name: 'compliment',
  aliases: ['praise'],
  category: 'fun',
  description: 'Send a wholesome compliment to someone or yourself',
  usage: '{p}compliment [@user]',

  async execute(sock, msg, args, extra) {
    const { mentions, quoted, sender, chat } = extra;
    let target = sender;

    if (mentions && mentions.length > 0) target = mentions[0];
    else if (quoted && quoted.sender) target = quoted.sender;

    const uNum = target.split('@')[0];
    const comp = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];

    await sock.sendMessage(chat, {
      text: `💖 Hey @${uNum}, ${comp}`,
      mentions: [target]
    }, { quoted: msg });
  }
};
