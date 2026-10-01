/**
 * Leave/Goodbye Event Handler - Goat Bot V2 WhatsApp Edition
 */

module.exports = {
  config: {
    name: 'leave',
    version: '2.0',
    author: 'frnAlt',
    description: 'Sends goodbye message when members leave or are kicked from the group'
  },

  async execute({ sock, groupId, participants, settings }) {
    if (!settings.goodbye) return;

    for (const user of participants) {
      const uNum = user.split('@')[0];
      const text = settings.customGoodbye
        ? settings.customGoodbye.replace('{user}', `@${uNum}`)
        : `👋 Goodbye @${uNum}! We wish you all the best.`;

      await sock.sendMessage(groupId, { text, mentions: [user] });
    }
  }
};
