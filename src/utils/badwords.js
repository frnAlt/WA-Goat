/**
 * Antibadword List and Detection Engine
 */

const defaultBadwords = [
  'chutiya', 'madarchod', 'bhosdike', 'gandu', 'bhenchod', 'harami', 'kutta',
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy',
  'whore', 'slut', 'nigger', 'nigga', 'faggot'
];

function containsBadWord(text, customList = []) {
  if (!text || typeof text !== 'string') return false;
  const list = [...new Set([...defaultBadwords, ...customList])];
  const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/gi, ' ');
  const words = cleaned.split(/\s+/).filter(Boolean);

  for (const word of words) {
    if (list.includes(word)) return true;
  }
  return false;
}

module.exports = {
  defaultBadwords,
  containsBadWord
};
