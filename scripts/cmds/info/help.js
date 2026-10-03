/**
 * @author frnAlt
 * Help Command - GoatBot V2 Signature Format for WhatsApp
 * Matches https://github.com/lazyneoaz/Goatbot-V2/blob/main/scripts/cmds/help.js
 */

const commandManager = require('../../../src/core/command');
const config = require('../../../src/config');

module.exports = {
  config: {
    name: 'help',
    version: '1.21',
    author: "frnAlt",
    countDown: 2,
    role: 0,
    category: 'info',
    shortDescription: { en: 'View command usage and information' },
    longDescription: { en: 'Displays list of all commands by category or detailed usage for a command.' },
    guide: {
      en: '{pn}: show every command grouped by category\n' +
        '   {pn} <command name> [-u | usage | -g | guide]: only show command usage\n' +
        '   {pn} <command name> [-i | info]: only show command info\n' +
        '   {pn} <command name> [-r | role]: only show command role\n' +
        '   {pn} <command name> [-a | alias]: only show command alias'
    }
  },

  name: 'help',
  aliases: ['menu', 'commands', 'cmds'],
  category: 'utility',
  description: 'View command usage and information',
  usage: '{p}help [command name] [-u|-i|-r|-a]',
  version: '1.21',
  author: "frnAlt",
  cooldown: 2,
  role: 0,

  async execute(sock, msg, args, extra) {
    const { message, prefix } = extra;
    const commandName = (args[0] || '').toLowerCase().trim();
    const flag = (args[1] || '').toLowerCase().trim();

    // 1. SPECIFIC COMMAND DETAIL LOOKUP
    if (commandName && !/^\d+$/.test(commandName) && commandName !== 'all') {
      const command = commandManager.get(commandName);

      if (!command) {
        return await message.reply(`❌ Command "${commandName}" does not exist. Type ${prefix}help to see available commands.`);
      }

      const raw = command.raw?.config || command.raw || {};
      const name = command.name;
      const desc = raw.description?.en || raw.description || command.description || 'No description available';
      const author = raw.author || command.author || 'frnAlt';
      const version = raw.version || command.version || '1.0.0';
      const aliasesList = command.aliases && command.aliases.length > 0 ? command.aliases.join(', ') : 'Do not have';
      const aliasesThisGroup = 'Do not have';
      const cooldown = command.cooldown || raw.countDown || 2;
      const roleNum = command.role !== undefined ? command.role : (raw.role || 0);

      const roleText = roleNum === 0
        ? '0 (All users)'
        : roleNum === 1
        ? '1 (Group administrators)'
        : roleNum === 2
        ? '2 (Admin bot)'
        : '4 (Bot Owner)';

      let guideBody = raw.guide?.en || raw.guide || command.usage || `{p}${name}`;
      if (typeof guideBody === 'object' && guideBody !== null) {
        guideBody = guideBody.body || guideBody.en || `{p}${name}`;
      }
      guideBody = guideBody
        .replace(/\{prefix\}|\{p\}/g, prefix)
        .replace(/\{name\}|\{n\}/g, name)
        .replace(/\{pn\}/g, prefix + name);

      // Subflag handling (-u / -g, -i, -r, -a)
      if (/^-u|usage|-g|guide$/i.test(flag)) {
        const text =
`╭── USAGE ────⭓
│ ${guideBody.split('\n').join('\n│ ')}
╰─────────────⭓`;
        return await message.reply(text);
      }

      if (/^-a|alias|aliases$/i.test(flag)) {
        const text =
`╭── ALIAS ────⭓
│ Other names: ${aliasesList}
│ Other names in your group: ${aliasesThisGroup}
╰─────────────⭓`;
        return await message.reply(text);
      }

      if (/^-r|role$/i.test(flag)) {
        const text =
`╭── ROLE ────⭓
│ ${roleText}
╰─────────────⭓`;
        return await message.reply(text);
      }

      if (/^-i|info$/i.test(flag)) {
        const text =
`╭── INFO ────⭓
│ Command name: ${name}
│ Description: ${desc}
│ Other names: ${aliasesList}
│ Other names in your group: ${aliasesThisGroup}
│ Version: ${version}
│ Role: ${roleText}
│ Time per command: ${cooldown}s
│ Author: ${author}
╰─────────────⭓`;
        return await message.reply(text);
      }

      // Default full command card
      const text =
`╭── NAME ────⭓
│ ${name}
├── INFO
│ Description: ${desc}
│ Other names: ${aliasesList}
│ Other names in your group: ${aliasesThisGroup}
│ Version: ${version}
│ Role: ${roleText}
│ Time per command: ${cooldown}s
│ Author: ${author}
├── USAGE
│ ${guideBody.split('\n').join('\n│ ')}
├── NOTES
│ The content inside <XXXXX> can be changed
│ The content inside [a|b|c] is a or b or c
╰──────⭔`;

      return await message.reply(text);
    }

    // 2. LIST ALL COMMANDS GROUPED BY CATEGORY (GoatBot V2 Output)
    const categoriesMap = new Map();
    const allCommands = commandManager.getAll();

    for (const cmd of allCommands) {
      const category = (cmd.category || 'UTILITY').toUpperCase();
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, []);
      }
      categoriesMap.get(category).push(cmd.name);
    }

    const sortedCategories = [...categoriesMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    const botName = config.botName || 'Goat Bot V2';
    const lines = [];

    lines.push(`☠️ ${botName} ☠️`);

    let total = 0;
    for (const [category, cmdNames] of sortedCategories) {
      total += cmdNames.length;
      cmdNames.sort((a, b) => a.localeCompare(b));
      lines.push('');
      lines.push(`╭─『 ${category} 』`);
      lines.push(`│ ${cmdNames.join(' • ')}`);
      lines.push('╰───────────────♢');
    }

    lines.push('');
    lines.push(`Total Commands: ${total}`);
    lines.push(`Type: ${prefix}help <command> for details`);

    return await message.reply(lines.join('\n'));
  },

  async onStart({ message, args, prefix, extra }) {
    return this.execute(null, null, args, { message, prefix, ...extra });
  }
};
