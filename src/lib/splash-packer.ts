import type { SplashData } from './types';
import { compressGzip } from './gzip';

const OPPO_SPLASH_HDR_OFFSET = 0x4000;
const DATA_OFFSET = 0x8000;
const METADATA_SIZE = 0x80;

export async function packSplashImg(splashData: SplashData, originalFileSize?: number): Promise<Uint8Array> {
  return packSplashImgWithProgress(splashData, originalFileSize, () => {});
}

export async function packSplashImgWithProgress(
  splashData: SplashData, 
  originalFileSize?: number,
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  const { hasDDPH, ddphMagic, ddphFlag, header, images } = splashData;
  
  const compressedImages: { metadata: Uint8Array; compressedData: Uint8Array }[] = [];
  let totalCompressedSize = 0;
  
  onProgress?.(5);
  console.log('[packer] 开始打包，图片数量:', images.length, 'header.imgnumber:', header.imgnumber);
  
  // 第一步：压缩所有图片，计算总大小
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    console.log('[packer] 处理图片:', image.index, image.name, 'bmpData 大小:', image.bmpData.length);
    
    const compressed = await compressGzip(image.bmpData);
    
    console.log('[packer] 压缩后大小:', compressed.length);
    
    const metadata = new Uint8Array(METADATA_SIZE);
    const view = new DataView(metadata.buffer);
    view.setUint32(0, totalCompressedSize, true);
    view.setUint32(4, image.bmpData.length, true);
    view.setUint32(8, compressed.length, true);
    
    const encoder = new TextEncoder();
    const nameBytes = encoder.encode(image.name);
    for (let i = 0; i < Math.min(nameBytes.length, 0x74); i++) {
      metadata[12 + i] = nameBytes[i];
    }
    
    compressedImages.push({
      metadata,
      compressedData: compressed,
    });
    
    totalCompressedSize += compressed.length;
    
    // 更新进度 (压缩阶段占 80%)
    onProgress?.(5 + (i + 1) / images.length * 80);
    
    // 让出主线程，让进度条有机会渲染
    if (i % 3 === 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  const metadataSectionSize = header.imgnumber * METADATA_SIZE;
  const dataSectionSize = totalCompressedSize;
  const minTotalSize = DATA_OFFSET + dataSectionSize + metadataSectionSize;
  
  // 如果有原始文件大小，保持相同大小（用于填充）
  const totalSize = originalFileSize ? Math.max(minTotalSize, originalFileSize) : minTotalSize;
  const paddingSize = totalSize - minTotalSize;
  
  console.log('[packer] 计算大小:', { 
    totalSize, 
    minTotalSize,
    originalFileSize,
    paddingSize,
    DATA_OFFSET, 
    dataSectionSize, 
    metadataSectionSize 
  });
  
  const output = new Uint8Array(totalSize);
  const view = new DataView(output.buffer);
  
  // 1. 写入 DDPH header (如果有)
  if (hasDDPH && ddphMagic !== undefined && ddphFlag !== undefined) {
    view.setUint32(0, ddphMagic, true);
    view.setUint32(4, ddphFlag, true);
  }
  
  // 2. 写入 OPPO splash header
  const encoder = new TextEncoder();
  const magicBytes = encoder.encode(header.magic);
  for (let i = 0; i < Math.min(magicBytes.length, 12); i++) {
    output[OPPO_SPLASH_HDR_OFFSET + i] = magicBytes[i];
  }
  
  // 3. 写入前 3 个 metadata (保留原始数据)
  for (let i = 0; i < 3; i++) {
    const metadata = header.metadata[i];
    if (metadata) {
      output.set(metadata, OPPO_SPLASH_HDR_OFFSET + 12 + i * 0x40);
    }
  }
  
  // 4. 写入 zerofill
  const zerofillOffset = OPPO_SPLASH_HDR_OFFSET + 12 + 3 * 0x40;
  for (let i = 0; i < 0x40; i++) {
    output[zerofillOffset + i] = 0;
  }
  
  // 5. 写入 header 信息 (imgnumber, unknow, width, height, special)
  const headerInfoOffset = OPPO_SPLASH_HDR_OFFSET + 12 + 3 * 0x40 + 0x40;
  view.setUint32(headerInfoOffset, header.imgnumber, true);
  view.setUint32(headerInfoOffset + 4, header.unknow, true);
  view.setUint32(headerInfoOffset + 8, header.width, true);
  view.setUint32(headerInfoOffset + 12, header.height, true);
  view.setUint32(headerInfoOffset + 16, header.special, true);
  
  // 6. 写入图片元数据到固定位置 (headerInfoOffset + 20 = 0x4114)
  const metadataStartOffset = headerInfoOffset + 20;
  console.log('[packer] 写入元数据到固定位置:', metadataStartOffset);
  for (let i = 0; i < compressedImages.length; i++) {
    output.set(compressedImages[i].metadata, metadataStartOffset + i * METADATA_SIZE);
  }
  
  // 7. 写入压缩数据到 DATA_OFFSET (0x8000)
  let currentOffset = 0;
  for (let i = 0; i < compressedImages.length; i++) {
    const { compressedData } = compressedImages[i];
    output.set(compressedData, DATA_OFFSET + currentOffset);
    currentOffset += compressedData.length;
  }
  
  onProgress?.(95);
  
  // 8. 填充 padding (如果有)
  if (paddingSize > 0) {
    console.log('[packer] 添加填充:', paddingSize, '=', (paddingSize / 1024 / 1024).toFixed(2), 'MB');
  }
  
  onProgress?.(100);
  
  return output;
}

export function updateImage(
  splashData: SplashData,
  index: number,
  bmpData: Uint8Array
): void {
  if (index < 0 || index >= splashData.images.length) {
    throw new Error('图片索引超出范围');
  }
  
  const oldImage = splashData.images[index];
  if (oldImage.previewUrl) {
    URL.revokeObjectURL(oldImage.previewUrl);
  }
  
  const newBlob = new Blob([bmpData.buffer as ArrayBuffer], { type: 'image/bmp' });
  const newPreviewUrl = URL.createObjectURL(newBlob);
  
  splashData.images[index] = {
    ...oldImage,
    bmpData,
    blob: newBlob,
    previewUrl: newPreviewUrl,
  };
}

export function cleanupSplashData(splashData: SplashData): void {
  for (const image of splashData.images) {
    if (image.previewUrl) {
      URL.revokeObjectURL(image.previewUrl);
    }
  }
}
