import { readAllChunks } from './utils';
import pako from 'pako';

// Gzip header (10 bytes) - 与 opsplash C++ 代码完全一致
const GZIP_HEADER = new Uint8Array([
  0x1f, 0x8b, // ID1, ID2 (gzip magic)
  0x08,       // CM (deflate = 8)
  0x00,       // FLG (no flags)
  0x00, 0x00, 0x00, 0x00, // MTIME (0)
  0x00,       // XFL (compression level indicator, 0 = default)
  0x03,       // OS (0x3 = Unix/Linux)
]);

/**
 * 解压缩 opsplash 格式的 gzip 数据
 * 格式：10 字节 header + deflate 压缩数据 + 8 字节 footer (crc32 + isize)
 */
export async function decompressGzip(data: Uint8Array): Promise<Uint8Array> {
  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(arrayBuffer);
  writer.close();

  return await readAllChunks(ds.readable);
}

/**
 * 压缩数据为 opsplash 自定义 gzip 格式（带进度回调）
 * 格式：10 字节 header + deflate 压缩数据 (无 zlib 头尾) + 8 字节 footer (crc32 + isize)
 * 
 * 使用 pako 库的 deflateRaw 函数，确保与 lodepng_deflate 兼容
 */
export async function compressGzip(
  data: Uint8Array,
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  onProgress?.(0);

  const crc = calculateCRC32(data);
  onProgress?.(10);

  const compressed = pako.deflateRaw(data, { level: 6 });
  onProgress?.(80);

  const footerSize = 8;
  const output = new Uint8Array(GZIP_HEADER.length + compressed.length + footerSize);

  output.set(GZIP_HEADER, 0);

  output.set(compressed, GZIP_HEADER.length);

  const footerOffset = GZIP_HEADER.length + compressed.length;
  const view = new DataView(output.buffer);
  view.setUint32(footerOffset, crc, true);
  view.setUint32(footerOffset + 4, data.length, true);

  onProgress?.(95);

  try {
    const verify = pako.inflateRaw(compressed);
    console.log('[gzip] compressGzip:', {
      inputSize: data.length,
      compressedSize: compressed.length,
      outputSize: output.length,
      crc32: crc.toString(16),
      verifySize: verify.length,
      match: verify.length === data.length,
    });
  } catch (e) {
    console.error('[gzip] 验证失败:', e);
  }

  onProgress?.(100);
  return output;
}

export function calculateCRC32(data: Uint8Array): number {
  let crc = 0xffffffff;
  const table = getCRC32Table();
  
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
  }
  
  return (crc ^ 0xffffffff) >>> 0;
}

let crc32Table: number[] | null = null;

function getCRC32Table(): number[] {
  if (crc32Table) return crc32Table;
  
  crc32Table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crc32Table[i] = c >>> 0;
  }
  
  return crc32Table;
}
