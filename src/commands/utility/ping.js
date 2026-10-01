/**
 * Ping Command - Check latency and responsiveness
 */

const { convertTime } = require('../../utils/goatUtils');
const config = require('../../config');

module.exports = {
  name: 'ping',
  aliases: ['speed', 'latency'],
  category: 'utility',
  description: 'Test bot response speed and server latency',
  usage: '{p}ping',

  async execute(sock, msg, args, extra) {
    const start = Date.now();
    const sent = await extra.message.reply('🏓 Pong!');
    const latency = Date.now() - start;
    const uptime = convertTime(process.uptime() * 1000);

    const text = `
*╭━━━〔 ⚡ PING & STATUS 〕━━━╮*
*┃ 🚀 Latency :* ${latency} ms
*┃ ⏱️ Uptime  :* ${uptime}
*┃ 🤖 Bot     :* ${config.botName}
*┃ 🔖 Version :* v${config.version}
*╰━━━━━━━━━━━━━━━━━━━━╯*
`.trim();

    await extra.message.reply(text);
  }
};
