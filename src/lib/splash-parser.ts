import type { SplashData, SplashHeader, ImageMetadata } from './types';
import { readUint32, readString } from './utils';
import { decompressGzip } from './gzip';
import { isValidBmp } from './bmp';

const DDPH_MAGIC_V1 = 0x48504444;
const OPPO_SPLASH_MAGIC = 'SPLASH LOGO!';
const DDPH_HDR_OFFSET = 0x0;
const OPPO_SPLASH_HDR_OFFSET = 0x4000;
const DATA_OFFSET = 0x8000;
const METADATA_SIZE = 0x80;
const NAME_SIZE = 0x74;

export function parseSplashImg(buffer: ArrayBuffer): SplashData {
  const view = new DataView(buffer);
  
  let hasDDPH = false;
  let ddphMagic: number | undefined;
  let ddphFlag: number | undefined;
  
  const checkDDPH = view.getUint32(DDPH_HDR_OFFSET, true);
  if (checkDDPH === DDPH_MAGIC_V1) {
    hasDDPH = true;
    ddphMagic = checkDDPH;
    ddphFlag = view.getUint32(DDPH_HDR_OFFSET + 4, true);
  }
  
  const magicOffset = OPPO_SPLASH_HDR_OFFSET;
  const magic = readString(buffer, magicOffset, 12);
  
  if (magic !== OPPO_SPLASH_MAGIC) {
    throw new Error('不是有效的 OPPO splash 镜像文件');
  }
  
  const metadataOffset = magicOffset + 12 + 3 * 0x40 + 0x40;
  const imgnumber = readUint32(buffer, metadataOffset);
  const unknow = readUint32(buffer, metadataOffset + 4);
  const width = readUint32(buffer, metadataOffset + 8);
  const height = readUint32(buffer, metadataOffset + 12);
  const special = readUint32(buffer, metadataOffset + 16);
  
  const header: SplashHeader = {
    magic,
    metadata: [],
    imgnumber,
    unknow,
    width,
    height,
    special,
  };
  
  const metadataStart = metadataOffset + 20;
  const imagesMetadata: ImageMetadata[] = [];
  
  for (let i = 0; i < imgnumber; i++) {
    const offset = metadataStart + i * METADATA_SIZE;
    imagesMetadata.push({
      offset: readUint32(buffer, offset),
      realsz: readUint32(buffer, offset + 4),
      compsz: readUint32(buffer, offset + 8),
      name: readString(buffer, offset + 12, NAME_SIZE),
    });
  }
  
  header.metadata = imagesMetadata.map(m => {
    const bytes = new Uint8Array(METADATA_SIZE);
    const dv = new DataView(bytes.buffer);
    dv.setUint32(0, m.offset, true);
    dv.setUint32(4, m.realsz, true);
    dv.setUint32(8, m.compsz, true);
    for (let i = 0; i < NAME_SIZE; i++) {
      bytes[12 + i] = m.name.charCodeAt(i) || 0;
    }
    return bytes;
  });
  
  return {
    hasDDPH,
    ddphMagic,
    ddphFlag,
    header,
    images: [],
    originalBuffer: buffer,
  };
}

export async function extractImages(splashData: SplashData): Promise<SplashData> {
  const { header, originalBuffer } = splashData;
  const images: SplashData['images'] = [];
  
  const metadataStart = OPPO_SPLASH_HDR_OFFSET + 12 + 3 * 0x40 + 0x40 + 20;
  
  let totalCompsz = 0;
  let totalRealsz = 0;
  
  for (let i = 0; i < header.imgnumber; i++) {
    const metadata = {
      offset: readUint32(originalBuffer, metadataStart + i * METADATA_SIZE),
      realsz: readUint32(originalBuffer, metadataStart + i * METADATA_SIZE + 4),
      compsz: readUint32(originalBuffer, metadataStart + i * METADATA_SIZE + 8),
      name: readString(originalBuffer, metadataStart + i * METADATA_SIZE + 12, NAME_SIZE),
    };
    
    totalCompsz += metadata.compsz;
    totalRealsz += metadata.realsz;
    
    const compressedData = new Uint8Array(
      originalBuffer,
      DATA_OFFSET + metadata.offset,
      metadata.compsz
    );
    
    console.log('解包图片:', {
      name: metadata.name,
      offset: metadata.offset,
      compsz: metadata.compsz,
      realsz: metadata.realsz,
      ratio: (metadata.compsz / metadata.realsz * 100).toFixed(2) + '%',
    });
    
    // 检查原始压缩数据的 header
    const headerView = new DataView(compressedData.buffer, compressedData.byteOffset, 10);
    const flg = compressedData[3];
    let extraField: Uint8Array | null = null;
    let extraLen = 0;
    
    if (flg & 0x04) { // FEXTRA flag
      const xlen = headerView.getUint16(10, true);
      extraLen = xlen;
      extraField = compressedData.slice(10, 10 + xlen);
      console.log('原始压缩数据有 FEXTRA:', {
        name: metadata.name,
        xlen: extraLen,
        extra: Array.from(extraField).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '),
      });
    }
    
    console.log('原始压缩数据 header:', {
      name: metadata.name,
      header: Array.from(compressedData.slice(0, 10)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '),
      footer: Array.from(compressedData.slice(-8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '),
      flg: '0x' + flg.toString(16).padStart(2, '0'),
    });
    
    const bmpData = await decompressGzip(compressedData);
    
    console.log('解压后大小:', {
      name: metadata.name,
      bmpDataLength: bmpData.length,
      expectedRealsz: metadata.realsz,
    });
    
    if (!isValidBmp(bmpData)) {
      console.warn(`图片 ${metadata.name} 不是有效的 BMP 文件`);
    }
    
    // 从 BMP 数据中读取实际分辨率
    const bmpView = new DataView(bmpData.buffer, bmpData.byteOffset, bmpData.byteLength);
    const actualWidth = bmpView.getUint32(18, true);
    const actualHeight = bmpView.getUint32(22, true);
    
    const blob = new Blob([bmpData.buffer as ArrayBuffer], { type: 'image/bmp' });
    const previewUrl = URL.createObjectURL(blob);
    
    images.push({
      index: i,
      name: metadata.name,
      width: actualWidth,
      height: actualHeight,
      originalWidth: actualWidth, // 记录解包时的原始分辨率
      originalHeight: actualHeight,
      bmpData,
      blob,
      previewUrl,
    });
  }
  
  console.log('=== 原始文件元数据统计 ===');
  console.log('图片数量:', header.imgnumber);
  console.log('总压缩大小 (compsz 总和):', totalCompsz, '=', (totalCompsz / 1024 / 1024).toFixed(2), 'MB');
  console.log('总原始大小 (realsz 总和):', totalRealsz, '=', (totalRealsz / 1024 / 1024).toFixed(2), 'MB');
  console.log('原始文件总大小:', originalBuffer.byteLength, '=', (originalBuffer.byteLength / 1024 / 1024).toFixed(2), 'MB');
  console.log('DATA_OFFSET:', DATA_OFFSET);
  console.log('文件末尾偏移:', DATA_OFFSET + totalCompsz + header.imgnumber * METADATA_SIZE);
  
  splashData.images = images;
  return splashData;
}

export function getResolution(splashData: SplashData): { width: number; height: number } {
  return {
    width: splashData.header.width,
    height: splashData.header.height,
  };
}

export function getImageCount(splashData: SplashData): number {
  return splashData.header.imgnumber;
}
