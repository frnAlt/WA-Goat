/**
 * Weather Command - Real-time weather lookup
 */

const apiService = require('../../services/apiService');

module.exports = {
  name: 'weather',
  aliases: ['clima'],
  category: 'utility',
  description: 'Get real-time weather information for any city in the world',
  usage: '{p}weather <city name>',

  async execute(sock, msg, args, extra) {
    const { message } = extra;
    const city = args.join(' ').trim();

    if (!city) {
      return await message.reply('⚠️ Please provide a city name.\nExample: *!weather Dhaka* or *!weather New York*');
    }

    try {
      const data = await apiService.getWeather(city);
      const text = `
*╭━━━〔 🌤️ WEATHER REPORT 〕━━━╮*
*┃ 🏙️ Location    :* ${data.city}, ${data.country}
*┃ 🌡️ Temperature :* ${data.temp}°C
*┃ 🥶 Feels Like   :* ${data.feelsLike}°C
*┃ 💧 Humidity     :* ${data.humidity}%
*┃ 💨 Wind Speed   :* ${data.windSpeed} m/s
*┃ ☁️ Condition    :* ${data.description.toUpperCase()}
*╰━━━━━━━━━━━━━━━━━━━━╯*
`.trim();

      await message.reply(text);
    } catch (err) {
      await message.reply(`❌ ${err.message}`);
    }
  }
};
