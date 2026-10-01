/**
 * Truth Command - Truth prompts for Truth or Dare
 */

const TRUTHS = [
  'What is the most embarrassing thing you have ever searched on Google?',
  'What is a secret you have never told anyone in this group?',
  'Have you ever pretended to be sick to avoid hanging out with someone here?',
  'Who was your very first childhood crush?',
  'What is the worst lie you ever told your parents without getting caught?',
  'If you had to delete every app on your phone except three, which three would you keep?'
];

module.exports = {
  name: 'truth',
  aliases: ['asktruth'],
  category: 'fun',
  description: 'Get an honest truth question prompt',
  usage: '{p}truth',

  async execute(sock, msg, args, extra) {
    const truth = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
    await extra.message.reply(`🤫 *TRUTH QUESTION:*\n\n"${truth}"\n\n_Answer honestly!_`);
  }
};
