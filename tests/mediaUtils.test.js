const test = require('node:test');
const assert = require('node:assert');
const { containsLink, containsWhatsAppLink } = require('../src/utils/antilink');
const { containsBadWord } = require('../src/utils/badwords');
const { convertTime, formatNumber, randomNumber } = require('../src/utils/goatUtils');

test('Media, Moderation, and GoatBot Utils', async (t) => {
  await t.test('Antilink detection', () => {
    assert.strictEqual(containsWhatsAppLink('Join here: https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv'), true);
    assert.strictEqual(containsWhatsAppLink('No link here at all'), false);
    assert.strictEqual(containsLink('Check this site: https://example.com/test'), true);
  });

  await t.test('Badword detection', () => {
    assert.strictEqual(containsBadWord('What the fuck is this?'), true);
    assert.strictEqual(containsBadWord('Hello have a wonderful day!'), false);
  });

  await t.test('GoatBot helpers', () => {
    assert.strictEqual(convertTime(65000), '1m 5s');
    assert.strictEqual(formatNumber(1000000), '1,000,000');
    const rnd = randomNumber(5, 10);
    assert.ok(rnd >= 5 && rnd <= 10);
  });
});
