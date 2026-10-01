/**
 * Welcome Event Handler - Goat Bot V2 WhatsApp Edition
 */

module.exports = {
  config: {
    name: 'welcome',
    version: '2.0',
    author: 'frnAlt',
    description: 'Sends welcome message when members join the group'
  },

  async execute({ sock, groupId, participants, settings }) {
    if (!settings.welcome) return;

    for (const user of participants) {
      const uNum = user.split('@')[0];
      const text = settings.customWelcome
        ? settings.customWelcome.replace('{user}', `@${uNum}`)
        : `👋 Welcome @${uNum} to the group! Make sure to read the group description.`;

      await sock.sendMessage(groupId, { text, mentions: [user] });
    }
  }
};
