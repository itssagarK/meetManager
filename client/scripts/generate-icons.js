import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '../public');

// CRC32 table & calculator for valid PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcPayload = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcPayload);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePng(width, height) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw Image Data (Filter byte 0 per scanline + RGBA pixels)
  // Design: Executive dark badge (#09090b) with crisp blue border (#1d4ed8) and inner green dot (#16a34a)
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      const isBorder = x === 0 || x === width - 1 || y === 0 || y === height - 1 ||
                       (width >= 48 && (x === 1 || x === width - 2 || y === 1 || y === height - 2));

      // Center accent dot / calendar symbol
      const cx = width / 2;
      const cy = height / 2;
      const distCenter = Math.hypot(x - cx, y - cy);
      const isCenterDot = distCenter <= width * 0.22;

      if (isBorder) {
        // Executive Royal Blue (#1d4ed8)
        rawData[pxOffset] = 0x1d;
        rawData[pxOffset + 1] = 0x4e;
        rawData[pxOffset + 2] = 0xd8;
        rawData[pxOffset + 3] = 0xff;
      } else if (isCenterDot) {
        // Emerald Green Accent (#16a34a)
        rawData[pxOffset] = 0x16;
        rawData[pxOffset + 1] = 0xa3;
        rawData[pxOffset + 2] = 0x4a;
        rawData[pxOffset + 3] = 0xff;
      } else {
        // Executive Dark Charcoal (#09090b)
        rawData[pxOffset] = 0x09;
        rawData[pxOffset + 1] = 0x09;
        rawData[pxOffset + 2] = 0x0b;
        rawData[pxOffset + 3] = 0xff;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const sizes = [16, 48, 128];
for (const size of sizes) {
  const pngBuffer = generatePng(size, size);
  const targetPath = path.join(publicDir, `icon-${size}.png`);
  fs.writeFileSync(targetPath, pngBuffer);
  console.log(`Generated store-compliant PNG icon: ${targetPath} (${size}x${size})`);
}
