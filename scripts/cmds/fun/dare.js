/**
 * Dare Command - Truth or Dare challenge prompts
 */

const DARES = [
  'Send the last photo in your phone gallery to this group!',
  'Send a voice note singing your favorite chorus right now!',
  'Change your WhatsApp status to "I love Goat Bot V2" for 1 hour!',
  'Text your best friend that you are moving to Antarctica without explanation!',
  'Type a sentence using only emojis and let the group guess what it means!',
  'Do 20 pushups right now and send proof!'
];

module.exports = {
  name: 'dare',
  aliases: ['challenge'],
  category: 'fun',
  description: 'Get a crazy dare challenge prompt',
  usage: '{p}dare',

  async execute(sock, msg, args, extra) {
    const dare = DARES[Math.floor(Math.random() * DARES.length)];
    await extra.message.reply(`🎯 *YOUR DARE CHALLENGE:*\n\n"${dare}"\n\n_Do you accept the dare?_`);
  }
};
