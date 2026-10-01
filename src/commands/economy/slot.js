/**
 * Slot Command - Casino Slot Machine
 */

const database = require('../../database');

const ICONS = ['🍎', '🍒', '🍇', '🍋', '💎', '7️⃣'];

module.exports = {
  name: 'slot',
  aliases: ['slots', 'casino'],
  category: 'economy',
  description: 'Spin the casino slot machine for huge multipliers',
  usage: '{p}slot <bet>',

  async execute(sock, msg, args, extra) {
    const { sender, message } = extra;
    const bet = parseInt(args[0], 10);

    if (!bet || isNaN(bet) || bet <= 0) {
      return await message.reply('🎰 Usage: *!slot <bet amount>*\nExample: *!slot 50*');
    }

    const uNum = sender.replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');
    const userMoney = database.usersData.get(uNum, 'money', 0);

    if (userMoney < bet) {
      return await message.reply(`❌ You only have $${userMoney.toLocaleString()} coins.`);
    }

    const s1 = ICONS[Math.floor(Math.random() * ICONS.length)];
    const s2 = ICONS[Math.floor(Math.random() * ICONS.length)];
    const s3 = ICONS[Math.floor(Math.random() * ICONS.length)];

    let slotText = `
🎰 *CASINO SLOTS* 🎰
[ ${s1} | ${s2} | ${s3} ]

`.trim();

    if (s1 === s2 && s2 === s3) {
      const multiplier = s1 === '7️⃣' ? 10 : (s1 === '💎' ? 7 : 5);
      const winAmount = bet * multiplier;
      database.usersData.addMoney(uNum, winAmount);
      slotText += `\n\n🎉 JACKPOT! 3 matching symbols!\nYou won *$${winAmount.toLocaleString()}* coins (${multiplier}x)!`;
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      const winAmount = Math.floor(bet * 1.5);
      database.usersData.addMoney(uNum, winAmount);
      slotText += `\n\n✨ 2 matching symbols!\nYou won *$${winAmount.toLocaleString()}* coins (1.5x)!`;
    } else {
      database.usersData.subtractMoney(uNum, bet);
      slotText += `\n\n😢 No match! You lost *$${bet.toLocaleString()}* coins. Better luck next spin!`;
    }

    await message.reply(slotText);
  }
};
