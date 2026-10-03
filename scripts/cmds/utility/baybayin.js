function baybayin(text) {
  try {
    const pkg = require("baybayin-transliterator");
    if (typeof pkg === "function") return pkg(text);
    if (typeof pkg.default === "function") return pkg.default(text);
  } catch (_) {}
  const vowels = { a: 'ᜀ', e: 'ᜁ', i: 'ᜁ', o: 'ᜂ', u: 'ᜂ' };
  const consonants = {
    b: 'ᜊ', k: 'ᜃ', c: 'ᜃ', d: 'ᜇ', r: 'ᜇ', g: 'ᜄ', h: 'ᜑ',
    l: 'ᜎ', m: 'ᜋ', n: 'ᜈ', ng: 'ᜅ', p: 'ᜉ', s: 'ᜐ', t: 'ᜆ',
    w: 'ᜏ', y: 'ᜌ'
  };
  let res = '';
  let i = 0;
  const lower = String(text || '').toLowerCase();
  while (i < lower.length) {
    if (lower.slice(i, i + 2) === 'ng') {
      const next = lower[i + 2];
      if (next === 'a') { res += 'ᜅ'; i += 3; }
      else if (next === 'e' || next === 'i') { res += 'ᜅᜲ'; i += 3; }
      else if (next === 'o' || next === 'u') { res += 'ᜅᜳ'; i += 3; }
      else { res += 'ᜅ᜴'; i += 2; }
    } else if (consonants[lower[i]]) {
      const c = consonants[lower[i]];
      const next = lower[i + 1];
      if (next === 'a') { res += c; i += 2; }
      else if (next === 'e' || next === 'i') { res += c + 'ᜲ'; i += 2; }
      else if (next === 'o' || next === 'u') { res += c + 'ᜳ'; i += 2; }
      else { res += c + '᜴'; i += 1; }
    } else if (vowels[lower[i]]) {
      res += vowels[lower[i]];
      i++;
    } else {
      res += text[i];
      i++;
    }
  }
  return { baybayin: res };
}

/**
 * @type {CommandMeta}
 */
export const meta = {
  name: "baybayin",
  description: "Convert text into baybayin",
  version: "2.5.0",
  usage: "<prefix>baybayin <query>",
  author: "frnAlt",
  category: "Utilities",
  role: 0,
  noPrefix: false,
  waitingTime: 2,
  requirement: "3.0.0",
  icon: "✏️",
};

/**
 * @type {CommandStyle}
 */
export const style = {
  title: "Baybayin ✏️",
  titleFont: "bold",
  contentFont: "fancy",
};

export async function entry({ input, output }) {
  const trans = input.arguments.join(" ");
  if (!trans) {
    return output.reply(
      `✏️ | Please provide a word or a sentence to translate into baybayin`
    );
  }
  return output.reply(`**Result:**\n\n${baybayin(trans).baybayin}`);
}

/*@Liane ikaw na bahala irefix to ulit*/
