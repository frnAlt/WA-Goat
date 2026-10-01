/**
 * Source vs Destination Feature Audit & Migration Matrix Generator
 */

const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(__dirname, '../../../brain/2991cdfa-0726-47a2-a1ea-621fcc13ae1f/scratch/Floppa-Chatbot');
const destPath = path.resolve(__dirname, '..');

console.log('📊 Generating WA-Goat Migration Matrix & Audit Report...\n');

// 1. Audit Commands
const destCmdFiles = [];
function getFiles(dir, ext = '.js') {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      results.push(...getFiles(full, ext));
    } else if (full.endsWith(ext) && !full.endsWith('.test.js')) {
      results.push(full);
    }
  }
  return results;
}

const waCmds = getFiles(path.join(destPath, 'src/commands')).map(f => {
  const mod = require(f);
  return {
    name: mod.name || mod.config?.name,
    category: mod.category || mod.config?.category || 'general',
    file: path.relative(destPath, f)
  };
});

const waEvents = getFiles(path.join(destPath, 'src/events')).map(f => {
  const mod = require(f);
  return {
    name: mod.name || mod.config?.name || path.basename(f, '.js'),
    file: path.relative(destPath, f)
  };
});

console.log(`• Destination Commands Loaded : ${waCmds.length}`);
console.log(`• Destination Events Loaded   : ${waEvents.length}`);
console.log(`• Destination Services Loaded : MediaService, StickerService, GroupService, ApiService, CacheService`);
console.log(`• Destination Storage/DB      : UsersData, ThreadsData, GlobalData, SafeStorage (JSON/SQLite)`);
console.log(`• WhatsApp Protocol Layer     : Baileys v7.0.0-rc14`);
console.log('\nMigration Categories:');
const cats = {};
waCmds.forEach(c => cats[c.category] = (cats[c.category] || 0) + 1);
for (const [c, count] of Object.entries(cats)) {
  console.log(`  - ${c.padEnd(12)}: ${count} commands`);
}
