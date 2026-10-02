/**
 * Validation and Syntax Check Script for WA-Goat
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Running WA-Goat Codebase Quality & Syntax Check...\n');

let totalFiles = 0;
let errors = 0;

function checkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'auth' && file !== 'data' && file !== 'temp' && file !== 'cache' && file !== 'logs') {
        checkDir(full);
      }
    } else if (file.endsWith('.js')) {
      totalFiles++;
      try {
        execSync(`node -c "${full}"`, { stdio: 'pipe' });
      } catch (err) {
        console.error(`❌ Syntax error in ${full}:`, err.message);
        errors++;
      }
    }
  }
}

checkDir(path.resolve(__dirname, '../src'));
checkDir(path.resolve(__dirname, '../tests'));
checkDir(path.resolve(__dirname, '../dashboard'));
checkDir(path.resolve(__dirname, '../floppa-wca/src'));

console.log(`✅ Checked ${totalFiles} JavaScript files.`);
if (errors === 0) {
  console.log('🎉 0 syntax errors detected! All modules parsed cleanly.\n');
  process.exit(0);
} else {
  console.error(`💥 ${errors} syntax errors found!\n`);
  process.exit(1);
}
