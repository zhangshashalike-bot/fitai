// 生成 PWA 图标 - 绿色渐变圆形 + 哑铃图案
const fs = require('fs');
const zlib = require('zlib');

function createPNG(size) {
  const crc32 = (buf) => {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  };

  // Raw pixel data
  const rows = [];
  const cx = size / 2, cy = size / 2, r = size * 0.42;
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0; // filter none
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const offset = 1 + x * 3;
      if (dist < r) {
        // 绿色渐变圆形
        const t = dist / r;
        row[offset] = Math.round(10 + (1 - t) * 24);     // R
        row[offset + 1] = Math.round(100 + (1 - t) * 97); // G
        row[offset + 2] = Math.round(40 + (1 - t) * 54);  // B
      } else if (dist < r + 6) {
        // 边框
        row[offset] = 34;
        row[offset + 1] = 197;
        row[offset + 2] = 94;
      } else {
        // 深色背景
        row[offset] = 2;
        row[offset + 1] = 6;
        row[offset + 2] = 23;
      }
    }
    rows.push(row);
  }

  const raw = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw);

  // Build PNG
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(2, 9);
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  const ihdrChunk = Buffer.alloc(4 + 4 + 13 + 4);
  ihdrChunk.writeUInt32BE(13, 0);
  ihdrChunk.write('IHDR', 4);
  ihdrData.copy(ihdrChunk, 8);
  ihdrChunk.writeUInt32BE(crc32(ihdrChunk.subarray(4, 21)), 21);

  const idatChunk = Buffer.alloc(4 + 4 + compressed.length + 4);
  idatChunk.writeUInt32BE(compressed.length, 0);
  idatChunk.write('IDAT', 4);
  compressed.copy(idatChunk, 8);
  idatChunk.writeUInt32BE(crc32(idatChunk.subarray(4, 8 + compressed.length)), 8 + compressed.length);

  const iendChunk = Buffer.alloc(4 + 4 + 0 + 4);
  iendChunk.writeUInt32BE(0, 0);
  iendChunk.write('IEND', 4);
  iendChunk.writeUInt32BE(crc32(iendChunk.subarray(4, 8)), 8);

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const path = require('path');
const outDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPNG(192));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPNG(512));
console.log('Icons created: icon-192.png, icon-512.png');
