/**
 * Broadcast Command - Send announcement to all joined group chats
 */

const database = require('../../database');
const { delay } = require('@whiskeysockets/baileys');

module.exports = {
  name: 'broadcast',
  aliases: ['bc', 'announceall'],
  category: 'owner',
  description: 'Broadcast a message or announcement to all groups',
  usage: '{p}broadcast <message>',
  ownerOnly: true,
  role: 4,

  async execute(sock, msg, args, extra) {
    const { message } = extra;
    const text = args.join(' ').trim();

    if (!text) {
      return await message.reply('⚠️ Please provide the announcement text to broadcast.');
    }

    const allThreads = database.threadsData.getAll();
    const groupThreads = allThreads.filter(t => t.threadID && t.threadID.endsWith('@g.us'));

    if (groupThreads.length === 0) {
      return await message.reply('ℹ️ No group chats recorded in the database yet.');
    }

    await message.reply(`🚀 Broadcasting to ${groupThreads.length} groups...`);

    let successCount = 0;
    for (const group of groupThreads) {
      try {
        await sock.sendMessage(group.threadID, {
          text: `📢 *OFFICIAL BROADCAST*\n\n${text}\n\n— *Goat Bot V2 Admin Team*`
        });
        successCount++;
        await delay(1000); // 1s throttle between groups
      } catch (_) {}
    }

    await message.reply(`✅ Broadcast completed: Sent to ${successCount}/${groupThreads.length} groups.`);
  }
};
