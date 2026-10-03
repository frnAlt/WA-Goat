/**
 * Dice Command - Roll dice against the bot
 */

const database = require('../../../src/database');
const { randomNumber } = require('../../../src/utils/goatUtils');

module.exports = {
  name: 'dice',
  aliases: ['rolldice'],
  category: 'economy',
  description: 'Roll dice against the bot for coins',
  usage: '{p}dice <bet>',

  async execute(sock, msg, args, extra) {
    const { sender, message } = extra;
    const bet = parseInt(args[0], 10);

    if (!bet || isNaN(bet) || bet <= 0) {
      return await message.reply('🎲 Usage: *!dice <bet amount>*\nExample: *!dice 100*');
    }

    const uNum = sender.replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');
    const userMoney = database.usersData.get(uNum, 'money', 0);

    if (userMoney < bet) {
      return await message.reply(`❌ You only have $${userMoney.toLocaleString()} coins.`);
    }

    const playerRoll = randomNumber(1, 6) + randomNumber(1, 6);
    const botRoll = randomNumber(1, 6) + randomNumber(1, 6);

    let resultMsg = `🎲 *DICE BATTLE*\n• Your Roll: *${playerRoll}*\n• Bot Roll : *${botRoll}*\n\n`;

    if (playerRoll > botRoll) {
      database.usersData.addMoney(uNum, bet);
      resultMsg += `🎉 You won *$${(bet * 2).toLocaleString()}* coins!`;
    } else if (playerRoll < botRoll) {
      database.usersData.subtractMoney(uNum, bet);
      resultMsg += `😢 You lost *$${bet.toLocaleString()}* coins!`;
    } else {
      resultMsg += '🤝 It was a tie! Coins returned.';
    }

    await message.reply(resultMsg);
  }
};
