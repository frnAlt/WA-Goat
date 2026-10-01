/**
 * Antilink and URL Detection Utility
 */

const WHATSAPP_LINK_REGEX = /(https?:\/\/)?(chat\.whatsapp\.com\/[a-zA-Z0-9]{20,24}|wa\.me\/[0-9]+)/i;
const GENERAL_LINK_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/i;

function containsWhatsAppLink(text) {
  if (!text || typeof text !== 'string') return false;
  return WHATSAPP_LINK_REGEX.test(text);
}

function containsLink(text) {
  if (!text || typeof text !== 'string') return false;
  return GENERAL_LINK_REGEX.test(text);
}

function extractLinks(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(new RegExp(GENERAL_LINK_REGEX, 'gi'));
  return matches || [];
}

module.exports = {
  WHATSAPP_LINK_REGEX,
  GENERAL_LINK_REGEX,
  containsWhatsAppLink,
  containsLink,
  extractLinks
};
