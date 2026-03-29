/**
 * Generate PNG icons from SVG sources using Canvas API in Node.
 * Requires: npm install sharp (or run in browser console to generate manually)
 *
 * Quick alternative: use resvg-js or sharp to rasterize SVGs.
 * For now, creates placeholder PNGs from the SVG content.
 */
const fs = require('fs');
const path = require('path');

// Since we can't reliably render SVG to PNG in vanilla Node without
// native deps, this script creates a simple colored PNG placeholder.
// For production, convert using: npx svgexport icon-192.svg icon-192.png 192:192

function createMinimalPNG(width, height, r, g, b) {
  // Create a minimal valid PNG file with a solid color
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let c = 0xffffffff;
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let v = n;
      for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
      table[n] = v;
    }
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData));
    return Buffer.concat([len, typeAndData, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT - raw image data with zlib
  const { deflateSync } = require('zlib');
  const rawData = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 3)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const offset = y * (1 + width * 3) + 1 + x * 3;
      rawData[offset] = r;
      rawData[offset + 1] = g;
      rawData[offset + 2] = b;
    }
  }
  const compressed = deflateSync(rawData);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const ROOT = path.resolve(__dirname, '..');

// Dark background color matching the app theme (#1a1a1a = 26,26,26)
// with a slightly lighter center to suggest the gas plant icon
const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-192.png', size: 192 },
  { name: 'icon-maskable-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of sizes) {
  const png = createMinimalPNG(size, size, 26, 26, 46); // #1a1a2e
  fs.writeFileSync(path.join(ROOT, name), png);
  console.log(`  Generated ${name} (${size}x${size})`);
}

console.log('\nIMPORTANT: Replace these placeholder PNGs with proper rendered icons.');
console.log('Use: npx svgexport icon-192.svg icon-192.png 192:192');
console.log('Or use any SVG-to-PNG tool for final production icons.');
