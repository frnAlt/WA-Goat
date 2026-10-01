/**
 * Goat Bot V2 Core Helper Utilities Compatibility Layer
 */

const axios = require('axios');
const moment = require('moment-timezone');

function convertTime(miliSeconds, replaceSeconds = 's', replaceMinutes = 'm', replaceHours = 'h', replaceDays = 'd') {
  let seconds = Math.floor(miliSeconds / 1000);
  let days = Math.floor(seconds / (3600 * 24));
  seconds -= days * 3600 * 24;
  let hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  let minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;

  const parts = [];
  if (days > 0) parts.push(`${days}${replaceDays}`);
  if (hours > 0) parts.push(`${hours}${replaceHours}`);
  if (minutes > 0) parts.push(`${minutes}${replaceMinutes}`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}${replaceSeconds}`);

  return parts.join(' ');
}

function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-US');
}

function randomNumber(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomString(length = 10, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isNumber(val) {
  return typeof val === 'number' || (!isNaN(val) && !isNaN(parseFloat(val)));
}

function splitPage(array, page = 1, limit = 10) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const totalPages = Math.ceil(array.length / limit) || 1;
  const start = (pageNum - 1) * limit;
  const pageData = array.slice(start, start + limit);
  return {
    data: pageData,
    page: pageNum,
    totalPages,
    totalItems: array.length
  };
}

async function getStreamFromURL(url) {
  const res = await axios({
    method: 'GET',
    url,
    responseType: 'stream'
  });
  return res.data;
}

async function getBufferFromURL(url) {
  const res = await axios({
    method: 'GET',
    url,
    responseType: 'arraybuffer'
  });
  return Buffer.from(res.data);
}

module.exports = {
  convertTime,
  formatNumber,
  randomNumber,
  randomString,
  isNumber,
  splitPage,
  getStreamFromURL,
  getBufferFromURL
};
