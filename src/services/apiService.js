/**
 * External API Integrations Service
 */

const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class ApiService {
  /**
   * Get weather for a city
   */
  async getWeather(city) {
    try {
      const apiKey = config.apiKeys.weather || 'd7e795ae6a0d44aaa8abb1a0a7ac19e4';
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
      const res = await axios.get(url, { timeout: 8000 });
      const data = res.data;
      return {
        city: data.name,
        country: data.sys?.country,
        temp: data.main?.temp,
        feelsLike: data.main?.feels_like,
        humidity: data.main?.humidity,
        windSpeed: data.wind?.speed,
        description: data.weather?.[0]?.description,
        icon: data.weather?.[0]?.icon
      };
    } catch (err) {
      logger.warn('[API] Weather error:', err.message);
      throw new Error(`Could not find weather for "${city}".`);
    }
  }

  /**
   * AI Chatbot response
   */
  async getAiResponse(prompt, senderName = 'Friend') {
    // 1. If Gemini API key is provided
    if (config.apiKeys.gemini) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.apiKeys.gemini}`;
        const res = await axios.post(url, {
          contents: [{ parts: [{ text: prompt }] }]
        }, { timeout: 12000 });
        const reply = res.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return reply.trim();
      } catch (e) {
        logger.warn('[API] Gemini error, falling back to public AI API:', e.message);
      }
    }

    // 2. Free conversational AI API fallback
    try {
      const fallbackUrl = `https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(prompt)}&owner=${encodeURIComponent(config.ownerName)}&botname=${encodeURIComponent(config.botName)}`;
      const res = await axios.get(fallbackUrl, { timeout: 10000 });
      if (res.data?.response) return res.data.response;
    } catch (_) {}

    // 3. Secondary public AI fallback
    try {
      const simUrl = `https://api.simsimi.net/v2/?text=${encodeURIComponent(prompt)}&lc=en`;
      const res = await axios.get(simUrl, { timeout: 6000 });
      if (res.data?.success) return res.data.success;
    } catch (_) {}

    return `Hello ${senderName}! I heard: "${prompt}". How can I help you today?`;
  }

  /**
   * Random joke
   */
  async getJoke() {
    try {
      const res = await axios.get('https://v2.jokeapi.dev/joke/Any?safe-mode&type=single', { timeout: 5000 });
      if (res.data?.joke) return res.data.joke;
    } catch (_) {}
    return 'Why do programmers prefer dark mode? Because light attracts bugs!';
  }

  /**
   * Random quote
   */
  async getQuote() {
    try {
      const res = await axios.get('https://zenquotes.io/api/random', { timeout: 5000 });
      if (res.data?.[0]?.q) {
        return `"${res.data[0].q}" — ${res.data[0].a}`;
      }
    } catch (_) {}
    return '"The best way to get started is to quit talking and begin doing." — Walt Disney';
  }

  /**
   * Random fact
   */
  async getFact() {
    try {
      const res = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en', { timeout: 5000 });
      if (res.data?.text) return res.data.text;
    } catch (_) {}
    return 'Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still edible!';
  }

  /**
   * Shorten URL via tinyurl
   */
  async shortenUrl(longUrl) {
    try {
      const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`, { timeout: 6000 });
      return res.data;
    } catch (e) {
      throw new Error('Failed to shorten URL');
    }
  }
}

module.exports = new ApiService();
