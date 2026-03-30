/**
 * Build script for Cold Creek Gas Plant Simulator
 * Copies web assets into www/ for Capacitor to sync into native projects.
 * No transpilation needed — vanilla JS/HTML/CSS.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'www');

// Clean previous build
if (fs.existsSync(OUT)) {
  fs.rmSync(OUT, { recursive: true });
}
fs.mkdirSync(OUT, { recursive: true });

// Files and directories to copy into www/
const items = [
  'index.html',
  'style.css',
  'game.js',
  'src',
  'apple-touch-icon.png',
  'og-image.png',
  'manifest.json',
  'sw.js',
  'favicon.svg',
  'apple-touch-icon.svg',
  'icon-192.svg',
  'icon-512.svg',
  'icon-maskable-192.svg',
  'icon-maskable-512.svg',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-192.png',
  'icon-maskable-512.png',
  'robots.txt',
  'sitemap.xml',
  'ads.txt',
  '9082f7ccb22045ca8bf17e20eff4afcb.txt',
];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

for (const item of items) {
  const src = path.join(ROOT, item);
  const dest = path.join(OUT, item);
  if (fs.existsSync(src)) {
    copyRecursive(src, dest);
    console.log(`  ✓ ${item}`);
  } else {
    console.warn(`  ⚠ ${item} not found, skipping`);
  }
}

console.log(`\nBuild complete → www/`);
