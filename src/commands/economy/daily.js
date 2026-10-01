/**
 * Daily Command - Claim daily virtual rewards
 */

const database = require('../../database');
const { convertTime } = require('../../utils/goatUtils');

module.exports = {
  name: 'daily',
  aliases: ['claim', 'reward'],
  category: 'economy',
  description: 'Claim your daily coin reward every 24 hours',
  usage: '{p}daily',

  async execute(sock, msg, args, extra) {
    const { sender, message } = extra;
    const uNum = sender.replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');
    const user = database.usersData.get(uNum);

    const lastClaim = user.data?.lastDaily || 0;
    const cooldown = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();

    if (now - lastClaim < cooldown) {
      const remaining = cooldown - (now - lastClaim);
      return await message.reply(`⏳ You already claimed your daily reward! Come back in ${convertTime(remaining)}.`);
    }

    const reward = 500;
    const expReward = 50;

    database.usersData.addMoney(uNum, reward);
    database.usersData.set(uNum, now, 'data.lastDaily');
    database.usersData.set(uNum, (user.exp || 0) + expReward, 'exp');

    await message.reply(`🎉 You claimed your daily reward!\n💵 +$${reward.toLocaleString()} Coins\n⭐ +${expReward} EXP`);
  }
};
