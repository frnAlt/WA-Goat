/**
 * Eval Command - Secure evaluation of JavaScript code (Bot Owner only)
 */

const util = require('util');

module.exports = {
  name: 'eval',
  aliases: ['ev', '>'],
  category: 'owner',
  description: 'Evaluate JavaScript code (Restricted to Bot Owner)',
  usage: '{p}eval <code>',
  ownerOnly: true,
  role: 4,

  async execute(sock, msg, args, extra) {
    const { message } = extra;
    const code = args.join(' ').trim();

    if (!code) {
      return await message.reply('⚠️ Please provide code to evaluate.');
    }

    try {
      // Evaluate within an async wrapper context
      let result = await eval(`(async () => { ${code} })()`);
      if (typeof result !== 'string') {
        result = util.inspect(result, { depth: 2 });
      }
      if (result.length > 2000) {
        result = result.slice(0, 1990) + '... (truncated)';
      }
      await message.reply(`💻 *EVAL RESULT:*\n\`\`\`js\n${result}\n\`\`\``);
    } catch (err) {
      await message.reply(`❌ *EVAL ERROR:*\n\`\`\`js\n${err.message}\n\`\`\``);
    }
  }
};
