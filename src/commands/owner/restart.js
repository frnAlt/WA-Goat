/**
 * Restart Command - Restart bot process
 */

module.exports = {
  name: 'restart',
  aliases: ['reboot'],
  category: 'owner',
  description: 'Restart the bot process',
  usage: '{p}restart',
  ownerOnly: true,
  role: 4,

  async execute(sock, msg, args, extra) {
    await extra.message.reply('🔄 Restarting Goat Bot V2...');
    setTimeout(() => {
      process.exit(2);
    }, 1500);
  }
};
