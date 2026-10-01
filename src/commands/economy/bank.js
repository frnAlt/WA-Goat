/**
 * Bank Command - Deposit and withdraw coins
 */

const database = require('../../database');

module.exports = {
  name: 'bank',
  aliases: ['dep', 'withdraw', 'deposit'],
  category: 'economy',
  description: 'Deposit or withdraw coins from your bank account',
  usage: '{p}bank [deposit|withdraw|all] <amount>',

  async execute(sock, msg, args, extra) {
    const { sender, message } = extra;
    const uNum = sender.replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');
    const user = database.usersData.get(uNum);

    const action = (args[0] || 'info').toLowerCase();
    const wallet = user.money || 0;
    const bankBalance = user.data?.bank || 0;

    if (action === 'dep' || action === 'deposit') {
      let amount = args[1] === 'all' ? wallet : parseInt(args[1], 10);
      if (!amount || isNaN(amount) || amount <= 0) {
        return await message.reply('⚠️ Please provide a valid amount to deposit.\nExample: *!bank deposit 200* or *!bank deposit all*');
      }
      if (wallet < amount) {
        return await message.reply(`❌ You only have $${wallet.toLocaleString()} in your wallet.`);
      }

      database.usersData.subtractMoney(uNum, amount);
      database.usersData.set(uNum, bankBalance + amount, 'data.bank');
      return await message.reply(`🏦 Deposited *$${amount.toLocaleString()}* into your bank account.\nNew Bank Balance: $${(bankBalance + amount).toLocaleString()}`);
    }

    if (action === 'withdraw' || action === 'with') {
      let amount = args[1] === 'all' ? bankBalance : parseInt(args[1], 10);
      if (!amount || isNaN(amount) || amount <= 0) {
        return await message.reply('⚠️ Please provide a valid amount to withdraw.\nExample: *!bank withdraw 200* or *!bank withdraw all*');
      }
      if (bankBalance < amount) {
        return await message.reply(`❌ You only have $${bankBalance.toLocaleString()} in your bank account.`);
      }

      database.usersData.set(uNum, bankBalance - amount, 'data.bank');
      database.usersData.addMoney(uNum, amount);
      return await message.reply(`🏦 Withdrew *$${amount.toLocaleString()}* from your bank account.\nWallet Balance: $${(wallet + amount).toLocaleString()}`);
    }

    // Default: Show Bank Info
    await message.reply(`
🏦 *GOAT CENTRAL BANK*
*Wallet:* $${wallet.toLocaleString()}
*Bank Account:* $${bankBalance.toLocaleString()}

*Commands:*
• \`!bank deposit <amount|all>\`
• \`!bank withdraw <amount|all>\`
`.trim());
  }
};
