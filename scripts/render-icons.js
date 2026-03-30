/**
 * Render Cold Creek branded PNG icons from scratch using Node.js zlib.
 * Creates proper branded icons with the cryo snowflake design.
 * No external dependencies needed.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');

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

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

function createPNG(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw pixel data with filter bytes
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = pixels[srcIdx];     // R
      rawData[dstIdx + 1] = pixels[srcIdx + 1]; // G
      rawData[dstIdx + 2] = pixels[srcIdx + 2]; // B
      rawData[dstIdx + 3] = pixels[srcIdx + 3]; // A
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

// Simple pixel drawing helpers
function setPixel(pixels, w, x, y, r, g, b, a) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || x >= w || y < 0 || y >= w) return;
  const idx = (y * w + x) * 4;
  // Alpha blend
  const srcA = a / 255;
  const dstA = pixels[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA > 0) {
    pixels[idx] = Math.round((r * srcA + pixels[idx] * dstA * (1 - srcA)) / outA);
    pixels[idx + 1] = Math.round((g * srcA + pixels[idx + 1] * dstA * (1 - srcA)) / outA);
    pixels[idx + 2] = Math.round((b * srcA + pixels[idx + 2] * dstA * (1 - srcA)) / outA);
    pixels[idx + 3] = Math.round(outA * 255);
  }
}

function fillCircle(pixels, w, cx, cy, radius, r, g, b, a) {
  const r2 = radius * radius;
  for (let dy = -Math.ceil(radius); dy <= Math.ceil(radius); dy++) {
    for (let dx = -Math.ceil(radius); dx <= Math.ceil(radius); dx++) {
      const dist2 = dx * dx + dy * dy;
      if (dist2 <= r2) {
        // Anti-alias edge
        const edge = Math.sqrt(dist2) - radius + 1;
        const alpha = edge > 0 ? Math.max(0, 1 - edge) : 1;
        setPixel(pixels, w, cx + dx, cy + dy, r, g, b, Math.round(a * alpha));
      }
    }
  }
}

function drawLine(pixels, w, x1, y1, x2, y2, thickness, r, g, b, a) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(len * 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = x1 + dx * t;
    const cy = y1 + dy * t;
    fillCircle(pixels, w, cx, cy, thickness / 2, r, g, b, a);
  }
}

function fillRoundedRect(pixels, w, h, radius, r, g, b, a) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let inside = true;
      // Check corners
      if (x < radius && y < radius) {
        inside = ((x - radius) ** 2 + (y - radius) ** 2) <= radius ** 2;
      } else if (x >= w - radius && y < radius) {
        inside = ((x - (w - radius - 1)) ** 2 + (y - radius) ** 2) <= radius ** 2;
      } else if (x < radius && y >= h - radius) {
        inside = ((x - radius) ** 2 + (y - (h - radius - 1)) ** 2) <= radius ** 2;
      } else if (x >= w - radius && y >= h - radius) {
        inside = ((x - (w - radius - 1)) ** 2 + (y - (h - radius - 1)) ** 2) <= radius ** 2;
      }
      if (inside) {
        setPixel(pixels, w, x, y, r, g, b, a);
      }
    }
  }
}

function renderIcon(size, maskable) {
  const pixels = new Uint8Array(size * size * 4);
  const s = size / 100; // Scale factor (design is 100x100 base)

  // Background - dark blue (#1a1a2e)
  fillRoundedRect(pixels, size, size, Math.round(size * 0.2), 26, 26, 46, 255);

  // Safe zone offset for maskable (15% padding)
  const ox = maskable ? size * 0.15 : size * 0.05;
  const oy = maskable ? size * 0.15 : size * 0.05;
  const scale = maskable ? 0.7 : 0.9;

  const cx = size / 2;
  const cy = size * 0.45; // Slightly above center for CC text below

  // Outer glow
  fillCircle(pixels, size, cx, cy, 30 * s * scale, 14, 165, 233, 38);

  // Snowflake lines - #38bdf8 (56, 189, 248)
  const lw = Math.max(2, 2.5 * s * scale); // line width
  const sr = 26 * s * scale; // snowflake radius
  const lr = 56, lg = 189, lb = 248;
  const la = 230;

  // 6 main lines (3 through center)
  for (let angle = 0; angle < 3; angle++) {
    const rad = (angle * 60) * Math.PI / 180;
    const x1 = cx + Math.sin(rad) * sr;
    const y1 = cy - Math.cos(rad) * sr;
    const x2 = cx - Math.sin(rad) * sr;
    const y2 = cy + Math.cos(rad) * sr;
    drawLine(pixels, size, x1, y1, x2, y2, lw, lr, lg, lb, la);

    // Branch tips at each end
    const branchLen = 6 * s * scale;
    for (const [ex, ey] of [[x1, y1], [x2, y2]]) {
      const dirX = (ex - cx) / sr;
      const dirY = (ey - cy) / sr;
      // Two small branches at 45 degrees from the tip direction
      const perpX = -dirY;
      const perpY = dirX;
      drawLine(pixels, size, ex, ey,
        ex - dirX * branchLen + perpX * branchLen * 0.7,
        ey - dirY * branchLen + perpY * branchLen * 0.7,
        lw * 0.8, lr, lg, lb, la);
      drawLine(pixels, size, ex, ey,
        ex - dirX * branchLen - perpX * branchLen * 0.7,
        ey - dirY * branchLen - perpY * branchLen * 0.7,
        lw * 0.8, lr, lg, lb, la);
    }
  }

  // Center dot
  fillCircle(pixels, size, cx, cy, 3.5 * s * scale, lr, lg, lb, 255);

  // "CC" text below snowflake - #94a3b8
  const textY = cy + 36 * s * scale;
  const textSize = Math.max(4, 5 * s * scale);
  // Draw "C" (left)
  const cLeftX = cx - 8 * s * scale;
  drawCLetter(pixels, size, cLeftX, textY, textSize, 148, 163, 184, 220);
  // Draw "C" (right)
  const cRightX = cx + 3 * s * scale;
  drawCLetter(pixels, size, cRightX, textY, textSize, 148, 163, 184, 220);

  return createPNG(size, size, pixels);
}

function drawCLetter(pixels, w, x, y, size, r, g, b, a) {
  // Draw a C shape using arcs
  const radius = size;
  const thickness = Math.max(1.5, size * 0.35);
  for (let angle = 40; angle <= 320; angle += 2) {
    const rad = angle * Math.PI / 180;
    const px = x + Math.cos(rad) * radius;
    const py = y + Math.sin(rad) * radius;
    fillCircle(pixels, w, px, py, thickness / 2, r, g, b, a);
  }
}

// Generate all sizes
const icons = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-192.png', size: 192, maskable: true },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
];

for (const { name, size, maskable } of icons) {
  const png = renderIcon(size, maskable);
  fs.writeFileSync(path.join(ROOT, name), png);
  console.log(`  Generated ${name} (${size}x${size}${maskable ? ' maskable' : ''})`);
}

console.log('\nAll branded icons generated with cryo snowflake design.');
