/**
 * Alive Command - Check system status and memory
 */

const os = require('os');
const { convertTime } = require('../../utils/goatUtils');
const config = require('../../config');
const commandManager = require('../../core/command');

module.exports = {
  name: 'alive',
  aliases: ['botstatus', 'stats'],
  category: 'utility',
  description: 'Displays server stats, memory, uptime, and system status',
  usage: '{p}alive',

  async execute(sock, msg, args, extra) {
    const uptime = convertTime(process.uptime() * 1000);
    const osUptime = convertTime(os.uptime() * 1000);
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalCmds = commandManager.getAll().length;

    const text = `
*╭━━━〔 🐐 GOAT BOT V2 STATUS 〕━━━╮*
*┃ 🤖 Bot Name   :* ${config.botName}
*┃ 👑 Owner      :* ${config.ownerName}
*┃ ⏱️ Bot Uptime :* ${uptime}
*┃ 🖥️ Host Uptime:* ${osUptime}
*┃ 📊 RAM Heap   :* ${ramUsage} MB
*┃ 💾 System RAM :* ${freeMem} GB / ${totalMem} GB
*┃ ⚙️ Platform   :* ${os.platform()} (${os.arch()})
*┃ 📦 Commands   :* ${totalCmds}
*┃ 🟢 Status     :* Fully Operational ✅
*╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯*
`.trim();

    await extra.message.reply(text);
  }
};
