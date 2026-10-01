/**
 * Pay Command - Transfer coins to another member
 */

const database = require('../../database');

module.exports = {
  name: 'pay',
  aliases: ['transfer', 'sendmoney'],
  category: 'economy',
  description: 'Transfer coins from your wallet to another member',
  usage: '{p}pay @user <amount>',

  async execute(sock, msg, args, extra) {
    const { mentions, quoted, sender, message } = extra;
    let target = null;

    if (mentions && mentions.length > 0) target = mentions[0];
    else if (quoted && quoted.sender) target = quoted.sender;

    if (!target) {
      return await message.reply('👤 Please mention a user or reply to their message to transfer coins.');
    }

    const senderNum = sender.replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');
    const targetNum = target.replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');

    if (senderNum === targetNum) {
      return await message.reply('❌ You cannot transfer coins to yourself!');
    }

    // Find amount in args
    const amountArg = args.find(a => /^[0-9]+$/.test(a));
    const amount = parseInt(amountArg, 10);

    if (!amount || isNaN(amount) || amount <= 0) {
      return await message.reply('⚠️ Please provide a valid positive amount of coins to transfer.\nExample: *!pay @user 100*');
    }

    const senderMoney = database.usersData.get(senderNum, 'money', 0);
    if (senderMoney < amount) {
      return await message.reply(`❌ Insufficient balance! You only have $${senderMoney.toLocaleString()} coins.`);
    }

    database.usersData.subtractMoney(senderNum, amount);
    database.usersData.addMoney(targetNum, amount);

    await sock.sendMessage(extra.chat, {
      text: `💸 Transferred *$${amount.toLocaleString()}* coins from @${senderNum} to @${targetNum}.`,
      mentions: [sender, target]
    }, { quoted: msg });
  }
};
