/**
 * Work Command - Work a job to earn virtual coins
 */

const database = require('../../database');
const { randomNumber, convertTime } = require('../../utils/goatUtils');

const JOBS = [
  { name: 'Software Developer', payMin: 120, payMax: 350 },
  { name: 'Coffee Barista', payMin: 80, payMax: 200 },
  { name: 'Uber Driver', payMin: 90, payMax: 240 },
  { name: 'Chef at Gordon Ramsay Restaurant', payMin: 150, payMax: 400 },
  { name: 'Cybersecurity Analyst', payMin: 180, payMax: 450 },
  { name: 'Graphic Designer', payMin: 100, payMax: 260 }
];

module.exports = {
  name: 'work',
  aliases: ['job', 'earn'],
  category: 'economy',
  description: 'Work a random shift to earn coins (cooldown: 15 minutes)',
  usage: '{p}work',

  async execute(sock, msg, args, extra) {
    const { sender, message } = extra;
    const uNum = sender.replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');
    const user = database.usersData.get(uNum);

    const lastWork = user.data?.lastWork || 0;
    const cooldown = 15 * 60 * 1000; // 15 mins
    const now = Date.now();

    if (now - lastWork < cooldown) {
      const remaining = cooldown - (now - lastWork);
      return await message.reply(`💼 You are tired from your shift! Rest for another ${convertTime(remaining)}.`);
    }

    const job = JOBS[Math.floor(Math.random() * JOBS.length)];
    const earned = randomNumber(job.payMin, job.payMax);

    database.usersData.addMoney(uNum, earned);
    database.usersData.set(uNum, now, 'data.lastWork');

    await message.reply(`💼 You worked as a *${job.name}* and earned *$${earned.toLocaleString()}* coins!`);
  }
};
