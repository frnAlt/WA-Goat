/**
 * CoinFlip Command - Gamble coins on Heads or Tails
 */

const database = require('../../database');

module.exports = {
  name: 'coinflip',
  aliases: ['cf', 'flip'],
  category: 'economy',
  description: 'Bet coins on heads or tails (2x payout)',
  usage: '{p}coinflip <heads|tails> <bet>',

  async execute(sock, msg, args, extra) {
    const { sender, message } = extra;
    const choice = (args[0] || '').toLowerCase();
    const bet = parseInt(args[1], 10);

    if (!['heads', 'tails', 'h', 't'].includes(choice) || !bet || isNaN(bet) || bet <= 0) {
      return await message.reply('🪙 Usage: *!coinflip <heads|tails> <amount>*\nExample: *!coinflip heads 50*');
    }

    const uNum = sender.replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');
    const userMoney = database.usersData.get(uNum, 'money', 0);

    if (userMoney < bet) {
      return await message.reply(`❌ You only have $${userMoney.toLocaleString()} coins.`);
    }

    const normalizedChoice = (choice === 'heads' || choice === 'h') ? 'heads' : 'tails';
    const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = outcome === normalizedChoice;

    if (won) {
      database.usersData.addMoney(uNum, bet);
      await message.reply(`🪙 The coin landed on *${outcome.toUpperCase()}*!\n🎉 You won *$${(bet * 2).toLocaleString()}* coins!`);
    } else {
      database.usersData.subtractMoney(uNum, bet);
      await message.reply(`🪙 The coin landed on *${outcome.toUpperCase()}*!\n😢 You lost *$${bet.toLocaleString()}* coins.`);
    }
  }
};
