// 调试工具：对比 C++ 和 JavaScript 的压缩输出
import { compressGzip, calculateCRC32 } from './gzip';
import pako from 'pako';

// 创建一个测试 BMP 数据（模拟真实的 24 位 BMP）
function createTestBmp(width: number = 100, height: number = 100): Uint8Array {
  const rowSize = Math.ceil(width * 3 / 4) * 4; // BMP 行大小必须是 4 的倍数
  const pixelDataSize = rowSize * height;
  const headerSize = 54; // BMP 头大小
  const totalSize = headerSize + pixelDataSize;

  const bmp = new Uint8Array(totalSize);
  const view = new DataView(bmp.buffer);

  // BMP 文件头 (14 字节)
  view.setUint16(0, 0x4D42, true); // 'BM'
  view.setUint32(2, totalSize, true); // bfSize
  view.setUint16(6, 0, true); // bfReserved1
  view.setUint16(8, 0, true); // bfReserved2
  view.setUint32(10, headerSize, true); // bfoffBits

  // DIB 头 (40 字节 BITMAPINFOHEADER)
  view.setUint32(14, 40, true); // biSize
  view.setInt32(18, width, true); // biWidth
  view.setInt32(22, height, true); // biHeight
  view.setUint16(26, 1, true); // biPlanes
  view.setUint16(28, 24, true); // biBitCount
  view.setUint32(30, 0, true); // biCompression (BI_RGB)
  view.setUint32(34, pixelDataSize, true); // biSizeImage
  view.setInt32(38, 2835, true); // biXPelsPerMeter
  view.setInt32(42, 2835, true); // biYPelsPerMeter
  view.setUint32(46, 0, true); // biClrUsed
  view.setUint32(50, 0, true); // biClrImportant

  // 填充像素数据 (蓝色渐变)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = headerSize + y * rowSize + x * 3;
      bmp[offset] = 255;     // B
      bmp[offset + 1] = x * 255 / width; // G
      bmp[offset + 2] = y * 255 / height; // R
    }
  }

  return bmp;
}

async function debugCompression() {
  console.log('=== 调试 opsplash 压缩格式 ===\n');

  const bmpData = createTestBmp(100, 100);
  console.log('测试 BMP 数据大小:', bmpData.length);
  console.log('BMP 头 (前 16 字节):', Array.from(bmpData.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));

  // 使用我们的函数压缩
  const compressed = await compressGzip(bmpData);
  console.log('\n压缩后数据大小:', compressed.length);

  // 详细分析压缩数据
  console.log('\n=== 压缩数据结构分析 ===');
  console.log('Header (10 字节):', Array.from(compressed.slice(0, 10)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));

  const footerOffset = compressed.length - 8;
  const deflateData = compressed.slice(10, footerOffset);
  console.log('Deflate 数据大小:', deflateData.length);
  console.log('Deflate 数据 (前 16 字节):', Array.from(deflateData.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));

  const footer = compressed.slice(footerOffset);
  const footerView = new DataView(footer.buffer, footer.byteOffset, footer.byteLength);
  const crc32 = footerView.getUint32(0, true);
  const isize = footerView.getUint32(4, true);
  console.log('Footer (8 字节):', Array.from(footer).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
  console.log('CRC32:', '0x' + crc32.toString(16).padStart(8, '0'));
  console.log('ISIZE:', isize);

  // 验证 CRC32
  const calculatedCrc = calculateCRC32(bmpData);
  console.log('计算的 CRC32:', '0x' + calculatedCrc.toString(16).padStart(8, '0'));
  console.log('CRC32 匹配:', crc32 === calculatedCrc ? '✅' : '❌');
  console.log('ISIZE 匹配:', isize === bmpData.length ? '✅' : '❌');

  // 使用 pako 解压验证
  console.log('\n=== 解压验证 ===');
  try {
    const decompressed = pako.inflateRaw(deflateData);
    console.log('解压后数据大小:', decompressed.length);
    console.log('解压数据匹配:', decompressed.length === bmpData.length ? '✅' : '❌');

    // 逐字节对比
    let mismatch = false;
    for (let i = 0; i < Math.min(decompressed.length, bmpData.length); i++) {
      if (decompressed[i] !== bmpData[i]) {
        console.log(`位置 ${i} 不匹配：期望 ${bmpData[i]}, 实际 ${decompressed[i]}`);
        mismatch = true;
        break;
      }
    }
    if (!mismatch && decompressed.length === bmpData.length) {
      console.log('解压数据完全匹配！✅');
    }
  } catch (error) {
    console.log('解压失败:', error);
  }

  // 使用浏览器 DecompressionStream 验证
  console.log('\n=== 浏览器 DecompressionStream 验证 ===');
  try {
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    const arrayBuffer = compressed.buffer.slice(
      compressed.byteOffset,
      compressed.byteOffset + compressed.byteLength
    ) as ArrayBuffer;
    writer.write(arrayBuffer);
    writer.close();

    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    console.log('浏览器解压后数据大小:', result.length);
    console.log('浏览器解压数据匹配:', result.length === bmpData.length ? '✅' : '❌');
  } catch (error) {
    console.log('浏览器解压失败:', error);
  }

  // 输出完整的十六进制数据（前 256 字节）
  console.log('\n=== 完整压缩数据 (前 256 字节，十六进制) ===');
  const hexLines: string[] = [];
  for (let i = 0; i < Math.min(256, compressed.length); i += 16) {
    const hex = Array.from(compressed.slice(i, i + 16))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    hexLines.push(`${i.toString(16).padStart(4, '0')}: ${hex}`);
  }
  console.log(hexLines.join('\n'));

  // 输出 C 数组格式（可用于 C++ 测试）
  console.log('\n=== C 数组格式 (前 128 字节) ===');
  const cArray = Array.from(compressed.slice(0, 128))
    .map(b => '0x' + b.toString(16).padStart(2, '0'))
    .join(', ');
  console.log(`uint8_t test_gzip[] = { ${cArray} };`);

  // 输出可用于对比的信息
  console.log('\n=== 关键信息总结 ===');
  console.log('原始 BMP 大小:', bmpData.length, '字节');
  console.log('压缩后大小:', compressed.length, '字节');
  console.log('压缩率:', ((1 - compressed.length / bmpData.length) * 100).toFixed(2) + '%');
  console.log('Deflate 数据大小:', deflateData.length, '字节');
  console.log('Header 大小: 10 字节');
  console.log('Footer 大小: 8 字节');
  console.log('总开销:', 18, '字节');
}

debugCompression().catch(console.error);
