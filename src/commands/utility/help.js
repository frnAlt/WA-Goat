/**
 * Help Command - Interactive Command Menu and Category Browser
 */

const commandManager = require('../../core/command');
const config = require('../../config');

module.exports = {
  name: 'help',
  aliases: ['menu', 'commands', 'cmds'],
  category: 'utility',
  description: 'Display all available commands or get detailed help for a specific command',
  usage: '{p}help [command name | category]',

  async execute(sock, msg, args, extra) {
    const { message, prefix } = extra;
    const query = (args[0] || '').toLowerCase().trim();

    // 1. Specific command details
    if (query) {
      const cmd = commandManager.get(query);
      if (cmd) {
        const roleNames = ['Everyone', 'Group Admin', 'Bot Admin', 'Premium User', 'Bot Owner'];
        const text = `
*╭━━━〔 COMMAND INFO: ${cmd.name.toUpperCase()} 〕━━━╮*
*┃ 📛 Name:* ${cmd.name}
*┃ 🏷️ Aliases:* ${cmd.aliases.length > 0 ? cmd.aliases.join(', ') : 'None'}
*┃ 📂 Category:* ${cmd.category}
*┃ 🛡️ Permission:* ${roleNames[cmd.role] || 'Everyone'}
*┃ ⏱️ Cooldown:* ${cmd.cooldown}s
*┃ 📝 Description:* ${cmd.description}
*┃ 💡 Usage:* ${cmd.usage.replace(/\{p\}/g, prefix)}
*╰━━━━━━━━━━━━━━━━━━━━╯*
`.trim();
        return await message.reply(text);
      }
    }

    // 2. Full Menu grouped by category
    const categories = commandManager.getCategories();
    const totalCmds = commandManager.getAll().length;

    let menu = `
*╭━━━〔 ${config.botName.toUpperCase()} 〕━━━╮*
*┃ 👑 Owner:* ${config.ownerName}
*┃ ⚡ Prefix:* [ *${prefix}* ]
*┃ 📦 Total Commands:* ${totalCmds}
*┃ 🔖 Version:* v${config.version}
*╰━━━━━━━━━━━━━━━━━━━━╯*

*📖 AVAILABLE CATEGORIES & COMMANDS:*
`.trim();

    for (const [category, cmdNames] of categories.entries()) {
      const catTitle = category.toUpperCase();
      menu += `\n\n*╭───〔 ${catTitle} 〕───╮*\n`;
      const formattedList = cmdNames.map(c => `• ${prefix}${c}`).join('\n');
      menu += formattedList;
    }

    menu += `\n\n*💡 Tip:* Type *${prefix}help <command>* for usage details!`;

    await message.reply(menu.trim());
  }
};
