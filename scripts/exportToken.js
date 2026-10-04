#!/usr/bin/env node
/**
 * Standalone Utility to Export and Display WhatsApp Web Access Token (WA_WEB~...)
 * Useful for GitHub Actions, cloud runners, Docker, and VPS headless deployments.
 *
 * Usage:
 *   node scripts/exportToken.js
 */

const path = require('path');
const fs = require('fs-extra');
const { exportWaWebToken, readWaWebSessionContent, parseWaWebToken } = require('../src/utils/waWebAuth');

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔑  WA-Goat Session & Access Token Exporter');
  console.log('='.repeat(60) + '\n');

  const candidateDirs = [
    path.resolve(process.cwd(), 'auth'),
    path.resolve(process.cwd(), 'session'),
    path.resolve(process.cwd(), 'wca_auth')
  ];

  let foundToken = null;
  let source = null;

  // 1. Try active session directories
  for (const dir of candidateDirs) {
    const credsPath = path.join(dir, 'creds.json');
    if (await fs.pathExists(credsPath)) {
      try {
        const res = await exportWaWebToken(dir, { syncRootFiles: true });
        if (res?.token) {
          foundToken = res.token;
          source = `${path.basename(dir)}/creds.json`;
          break;
        }
      } catch (_) {}
    }
  }

  // 2. Try wa_web.json
  if (!foundToken) {
    const waWebPath = path.resolve(process.cwd(), 'wa_web.json');
    if (await fs.pathExists(waWebPath)) {
      try {
        const content = await fs.readJson(waWebPath);
        const parsed = parseWaWebToken(content);
        if (parsed?.creds) {
          const { encodeWaWebToken } = require('../src/utils/waWebAuth');
          foundToken = encodeWaWebToken(parsed.creds, parsed.keys);
          source = 'wa_web.json';
        }
      } catch (_) {}
    }
  }

  // 3. Try account.txt
  if (!foundToken) {
    const accPath = path.resolve(process.cwd(), 'account.txt');
    if (await fs.pathExists(accPath)) {
      try {
        const content = (await fs.readFile(accPath, 'utf8')).trim();
        if (content.startsWith('WA_WEB~') || content.length > 50) {
          foundToken = content;
          source = 'account.txt';
        }
      } catch (_) {}
    }
  }

  if (foundToken) {
    console.log(`✅ Valid WhatsApp session detected from: ${source}\n`);
    console.log('📋 Copy your WA_WEB_ACCESS_TOKEN below:');
    console.log('-'.repeat(60));
    console.log(foundToken);
    console.log('-'.repeat(60) + '\n');
    console.log('📌 Next Steps for GitHub Actions Deployment:');
    console.log('  1. Go to your GitHub repository -> Settings -> Secrets and variables -> Actions');
    console.log('  2. Click "New repository secret"');
    console.log('  3. Name: WA_WEB_ACCESS_TOKEN');
    console.log('  4. Secret: [Paste the token above]');
    console.log('  5. Re-run your workflow! The bot will log in automatically without QR code.\n');
  } else {
    console.log('⚠️  No active WhatsApp session found on this machine.\n');
    console.log('To link your WhatsApp account and generate a token:');
    console.log('  1. Run pairing mode with your phone number:');
    console.log('     PAIRING_CODE=true PAIRING_NUMBER=<your_phone_with_country_code> npm start');
    console.log('  2. Enter the 8-digit pairing code on your WhatsApp:');
    console.log('     (WhatsApp -> Linked Devices -> Link with phone number instead)');
    console.log('  3. Once logged in, run this script again: node scripts/exportToken.js\n');
  }
}

main().catch((err) => {
  console.error('❌ Error exporting token:', err.message);
  process.exit(1);
});
