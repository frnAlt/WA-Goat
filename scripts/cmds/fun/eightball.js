/**
 * 8Ball Command - Magic eight ball fortune teller
 */

const RESPONSES = [
  'It is certain.',
  'It is decidedly so.',
  'Without a doubt.',
  'Yes definitely.',
  'You may rely on it.',
  'As I see it, yes.',
  'Most likely.',
  'Outlook good.',
  'Yes.',
  'Signs point to yes.',
  'Reply hazy, try again.',
  'Ask again later.',
  'Better not tell you now.',
  'Cannot predict now.',
  'Concentrate and ask again.',
  'Don\'t count on it.',
  'My reply is no.',
  'My sources say no.',
  'Outlook not so good.',
  'Very doubtful.'
];

module.exports = {
  name: 'eightball',
  aliases: ['8ball', 'oracle'],
  category: 'fun',
  description: 'Ask the Magic 8-Ball a yes/no question',
  usage: '{p}8ball <question>',

  async execute(sock, msg, args, extra) {
    const { message } = extra;
    const question = args.join(' ').trim();

    if (!question) {
      return await message.reply('🎱 Please ask a question!\nExample: *!8ball Will I become a millionaire?*');
    }

    const answer = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
    await message.reply(`🎱 *MAGIC 8-BALL:*\n\n*Question:* "${question}"\n*Answer:* *${answer}*`);
  }
};
