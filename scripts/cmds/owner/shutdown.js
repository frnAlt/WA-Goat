/**
 * Shutdown Command - Stop bot process
 */

module.exports = {
  name: 'shutdown',
  aliases: ['stop'],
  category: 'owner',
  description: 'Shut down the bot process completely',
  usage: '{p}shutdown',
  ownerOnly: true,
  role: 4,

  async execute(sock, msg, args, extra) {
    await extra.message.reply('🛑 Shutting down Goat Bot V2...');
    setTimeout(() => {
      process.exit(0);
    }, 1500);
  }
};
