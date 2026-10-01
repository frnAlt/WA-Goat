/**
 * Calculator Command - Evaluate simple and scientific mathematical expressions
 */

const { evaluate } = require('mathjs');

module.exports = {
  name: 'calc',
  aliases: ['calculator', 'math'],
  category: 'utility',
  description: 'Perform simple and scientific mathematical calculations',
  usage: '{p}calc 20 * 5 / 2 + sqrt(144)',

  async execute(sock, msg, args, extra) {
    const { message } = extra;
    const expression = args.join(' ').trim();

    if (!expression) {
      return await message.reply('⚠️ Please provide a math expression to evaluate.\nExample: *!calc 25 * 4 + 10*');
    }

    try {
      const result = evaluate(expression);
      const text = `
*╭━━━〔 💻 CALCULATOR 〕━━━╮*
*┃ 🔢 Expression :* ${expression}
*┃ 🎯 Result     :* = ${result}
*╰━━━━━━━━━━━━━━━━━━━━╯*
`.trim();

      await message.reply(text);
    } catch (err) {
      await message.reply(`❌ Invalid mathematical expression: ${err.message}`);
    }
  }
};
