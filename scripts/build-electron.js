#!/usr/bin/env node

/**
 * build-electron.js — Builds Cold Creek for Steam via electron-builder.
 *
 * Usage:
 *   node scripts/build-electron.js          # Build for current platform
 *   node scripts/build-electron.js --win    # Build for Windows
 *   node scripts/build-electron.js --mac    # Build for macOS
 *   node scripts/build-electron.js --all    # Build for both
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const root = path.resolve(__dirname, '..');

// Preflight: ensure STEAM_APP_ID is set before building for distribution
const mainSrc = fs.readFileSync(path.join(root, 'electron/main.js'), 'utf-8');
if (/STEAM_APP_ID\s*=\s*0/.test(mainSrc) && !args.includes('--dev')) {
  console.error('[build-electron] STEAM_APP_ID is still 0 in electron/main.js.');
  console.error('[build-electron] Set your real App ID before building for Steam.');
  console.error('[build-electron] Use --dev flag to bypass this check for local testing.');
  process.exit(1);
}

// Determine target platforms
let platforms = [];
if (args.includes('--all')) {
  platforms = ['--win', '--mac'];
} else if (args.includes('--win')) {
  platforms = ['--win'];
} else if (args.includes('--mac')) {
  platforms = ['--mac'];
} else {
  // Default: build for current platform
  platforms = [''];
}

console.log('[build-electron] Starting Cold Creek Steam build...');
console.log('[build-electron] Targets:', platforms.length ? platforms.join(', ') : 'current platform');

for (const platform of platforms) {
  const cmd = `npx electron-builder --config electron-builder.yml ${platform}`.trim();
  console.log(`[build-electron] Running: ${cmd}`);
  try {
    execSync(cmd, { cwd: root, stdio: 'inherit' });
    console.log(`[build-electron] ${platform || 'current platform'} build complete.`);
  } catch (e) {
    console.error(`[build-electron] Build failed for ${platform || 'current platform'}:`, e.message);
    process.exit(1);
  }
}

console.log('[build-electron] All builds complete. Output in dist/');
console.log('[build-electron] Upload to Steam via SteamCMD using steamcmd/app_build.vdf');
