/**
 * Exec Command - Execute shell commands (Bot Owner only)
 */

const { exec } = require('child_process');

module.exports = {
  name: 'exec',
  aliases: ['$', 'shell', 'bash'],
  category: 'owner',
  description: 'Execute shell commands on host (Restricted to Bot Owner)',
  usage: '{p}exec <command>',
  ownerOnly: true,
  role: 4,

  async execute(sock, msg, args, extra) {
    const { message } = extra;
    const cmd = args.join(' ').trim();

    if (!cmd) {
      return await message.reply('⚠️ Please provide a shell command.');
    }

    exec(cmd, { timeout: 30000 }, async (err, stdout, stderr) => {
      let output = stdout || stderr || (err ? err.message : 'Executed with no output.');
      if (output.length > 2000) {
        output = output.slice(0, 1990) + '... (truncated)';
      }
      await message.reply(`🖥️ *SHELL OUTPUT:*\n\`\`\`bash\n${output}\n\`\`\``);
    });
  }
};
