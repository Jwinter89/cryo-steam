/**
 * Generate PWA icons for Cold Creek
 * Creates PNG icons from an inline SVG design.
 * Run: node scripts/generate-icons.js
 *
 * Uses only Node built-ins — draws a simple branded icon as an SVG
 * then converts to PNG via a canvas-free approach (inline SVG → data URI).
 * For production, replace these with your real designed icons.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function createIconSVG(size, maskable = false) {
  const padding = maskable ? Math.round(size * 0.1) : 0;
  const innerSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const radius = innerSize / 2;

  // Flame/gas icon paths scaled to the icon
  const scale = innerSize / 100;
  const tx = cx - 50 * scale;
  const ty = cy - 50 * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${maskable ? 0 : size * 0.2}" fill="#1a1a2e"/>
  <g transform="translate(${tx}, ${ty}) scale(${scale})">
    <!-- Outer glow -->
    <circle cx="50" cy="52" r="32" fill="#0ea5e9" opacity="0.15"/>
    <!-- Snowflake / cryo symbol -->
    <g stroke="#38bdf8" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.9">
      <!-- Vertical line -->
      <line x1="50" y1="22" x2="50" y2="78"/>
      <!-- Diagonal lines -->
      <line x1="25.8" y1="36" x2="74.2" y2="64"/>
      <line x1="25.8" y1="64" x2="74.2" y2="36"/>
      <!-- Branch tips -->
      <line x1="50" y1="22" x2="44" y2="28"/>
      <line x1="50" y1="22" x2="56" y2="28"/>
      <line x1="50" y1="78" x2="44" y2="72"/>
      <line x1="50" y1="78" x2="56" y2="72"/>
      <line x1="25.8" y1="36" x2="27" y2="44"/>
      <line x1="25.8" y1="36" x2="33" y2="34"/>
      <line x1="74.2" y1="64" x2="73" y2="56"/>
      <line x1="74.2" y1="64" x2="67" y2="66"/>
      <line x1="25.8" y1="64" x2="27" y2="56"/>
      <line x1="25.8" y1="64" x2="33" y2="66"/>
      <line x1="74.2" y1="36" x2="73" y2="44"/>
      <line x1="74.2" y1="36" x2="67" y2="34"/>
    </g>
    <!-- Center dot -->
    <circle cx="50" cy="50" r="4" fill="#38bdf8"/>
    <!-- "CC" text -->
    <text x="50" y="95" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#94a3b8" letter-spacing="2">CC</text>
  </g>
</svg>`;
}

// Write SVG icons (browsers accept SVG icons, and we'll also keep them as fallback)
const sizes = [192, 512];
const variants = [false, true]; // regular, maskable

for (const size of sizes) {
  for (const maskable of variants) {
    const svg = createIconSVG(size, maskable);
    const suffix = maskable ? '-maskable' : '';
    const svgPath = path.join(ROOT, `icon${suffix}-${size}.svg`);
    fs.writeFileSync(svgPath, svg);
    console.log(`  ✓ icon${suffix}-${size}.svg`);
  }
}

// Also create a simple favicon SVG
const faviconSvg = createIconSVG(32, false);
fs.writeFileSync(path.join(ROOT, 'favicon.svg'), faviconSvg);
console.log('  ✓ favicon.svg');

// Create apple-touch-icon SVG (180x180)
const appleSvg = createIconSVG(180, false);
fs.writeFileSync(path.join(ROOT, 'apple-touch-icon.svg'), appleSvg);
console.log('  ✓ apple-touch-icon.svg');

console.log('\nIcon generation complete!');
console.log('Note: For production, convert SVGs to PNGs using:');
console.log('  npx sharp-cli -i icon-192.svg -o icon-192.png resize 192 192');
console.log('  npx sharp-cli -i icon-512.svg -o icon-512.png resize 512 512');
console.log('Or use any SVG-to-PNG tool / image editor.');
console.log('\nFor now, updating manifest.json to use SVG icons...');

// Update manifest to reference SVG icons (widely supported for PWA)
const manifestPath = path.join(ROOT, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.icons = [
  {
    src: '/icon-192.svg',
    sizes: '192x192',
    type: 'image/svg+xml',
    purpose: 'any'
  },
  {
    src: '/icon-512.svg',
    sizes: '512x512',
    type: 'image/svg+xml',
    purpose: 'any'
  },
  {
    src: '/icon-maskable-192.svg',
    sizes: '192x192',
    type: 'image/svg+xml',
    purpose: 'maskable'
  },
  {
    src: '/icon-maskable-512.svg',
    sizes: '512x512',
    type: 'image/svg+xml',
    purpose: 'maskable'
  }
];
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('  ✓ manifest.json updated with SVG icon references');
