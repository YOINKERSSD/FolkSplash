export interface BmpHeader {
  bftype: number;
  bfSize: number;
  bfReserved1: number;
  bfReserved2: number;
  bfoffBits: number;
  size: number;
  width: number;
  height: number;
  planes: number;
  bitCount: number;
  compression: number;
  imageSize: number;
  xPixelsPerMeter: number;
  yPixelsPerMeter: number;
  colorsUsed: number;
  colorsImportant: number;
}

export function parseBmpHeader(data: Uint8Array): BmpHeader {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  
  return {
    bftype: view.getUint16(0, true),
    bfSize: view.getUint32(2, true),
    bfReserved1: view.getUint16(6, true),
    bfReserved2: view.getUint16(8, true),
    bfoffBits: view.getUint32(10, true),
    size: view.getUint32(14, true),
    width: view.getUint32(18, true),
    height: view.getUint32(22, true),
    planes: view.getUint16(26, true),
    bitCount: view.getUint16(28, true),
    compression: view.getUint32(30, true),
    imageSize: view.getUint32(34, true),
    xPixelsPerMeter: view.getInt32(38, true),
    yPixelsPerMeter: view.getInt32(42, true),
    colorsUsed: view.getUint32(46, true),
    colorsImportant: view.getUint32(50, true),
  };
}

export function isValidBmp(data: Uint8Array): boolean {
  if (data.length < 54) return false;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const magic = view.getUint16(0, true);
  const offBits = view.getUint32(10, true);
  return magic === 0x4d42 && offBits === 0x36;
}

export function decodeBmpToRGBA(bmpData: Uint8Array): { data: Uint8ClampedArray; width: number; height: number } {
  const header = parseBmpHeader(bmpData);
  const { width, height, bitCount, bfoffBits } = header;
  
  const numChannels = bitCount / 8;
  const scanlineBytes = width * numChannels;
  const padding = (4 - (scanlineBytes % 4)) % 4;
  const scanlineBytesWithPadding = scanlineBytes + padding;
  
  const rgbaData = new Uint8ClampedArray(width * height * 4);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const bmpY = height - y - 1;
      const bmpOffset = bfoffBits + bmpY * scanlineBytesWithPadding + x * numChannels;
      const rgbaOffset = (y * width + x) * 4;
      
      if (numChannels === 3) {
        rgbaData[rgbaOffset + 0] = bmpData[bmpOffset + 2];
        rgbaData[rgbaOffset + 1] = bmpData[bmpOffset + 1];
        rgbaData[rgbaOffset + 2] = bmpData[bmpOffset + 0];
        rgbaData[rgbaOffset + 3] = 255;
      } else if (numChannels === 4) {
        rgbaData[rgbaOffset + 0] = bmpData[bmpOffset + 2];
        rgbaData[rgbaOffset + 1] = bmpData[bmpOffset + 1];
        rgbaData[rgbaOffset + 2] = bmpData[bmpOffset + 0];
        rgbaData[rgbaOffset + 3] = bmpData[bmpOffset + 3];
      }
    }
  }
  
  return { data: rgbaData, width, height };
}

export function encodeBmpFromRGBA(
  rgbaData: Uint8ClampedArray,
  width: number,
  height: number,
  onProgress?: (progress: number) => void
): Uint8Array {
  const outputChannels = 3;
  const imagerowbytes = outputChannels * width;
  const rowPadding = (4 - (imagerowbytes % 4)) % 4;
  const scanlineBytes = imagerowbytes + rowPadding;
  const pixelDataSize = scanlineBytes * height;
  const totalSize = 54 + pixelDataSize;

  const bmp = new Uint8Array(totalSize);
  const view = new DataView(bmp.buffer);

  // BMP 文件头 (14 字节)
  view.setUint16(0, 0x4d42, true);
  view.setUint32(2, totalSize, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint32(10, 54, true);

  // DIB 头 (40 字节)
  view.setUint32(14, 40, true);
  view.setUint32(18, width, true);
  view.setUint32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(30, 0, true);
  view.setUint32(34, pixelDataSize, true);
  view.setInt32(38, 0, true);
  view.setInt32(42, 0, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  // 优化后的像素数据处理 - 批量操作
  const rowSizeIn = width * 4;
  let dstOffset = 54;
  const totalRows = height;

  for (let y = height - 1; y >= 0; y--) {
    const srcOffset = y * rowSizeIn;
    const rowEnd = srcOffset + rowSizeIn;

    for (let srcPos = srcOffset; srcPos < rowEnd; srcPos += 4) {
      bmp[dstOffset++] = rgbaData[srcPos + 2];
      bmp[dstOffset++] = rgbaData[srcPos + 1];
      bmp[dstOffset++] = rgbaData[srcPos + 0];
    }

    dstOffset += rowPadding;

    if (onProgress && (totalRows - y) % Math.max(1, Math.floor(totalRows / 10)) === 0) {
      const progress = ((totalRows - y) / totalRows) * 100;
      onProgress(Math.min(progress, 100));
    }
  }

  if (onProgress) {
    onProgress(100);
  }

  return bmp;
}

/**
 * 将图片文件转换为 BMP 格式（优化版 - 使用 createImageBitmap 和 OffscreenCanvas）
 * @param file 图片文件
 * @param targetWidth 目标宽度
 * @param targetHeight 目标高度
 * @param keepOriginal 是否保持原始分辨率（不缩放）
 * @param fitMode 适配模式：'cover' (裁剪填充) | 'contain' (完整包含) | 'stretch' (拉伸)
 * @param onProgress 进度回调 (0-100)
 */
export async function imageFileToBmp(
  file: File,
  targetWidth: number,
  targetHeight: number,
  keepOriginal: boolean = false,
  fitMode: 'cover' | 'contain' | 'stretch' = 'cover',
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  try {
    onProgress?.(5);
    const bitmap = await createImageBitmap(file);
    onProgress?.(10);

    let finalWidth = targetWidth;
    let finalHeight = targetHeight;

    if (keepOriginal) {
      finalWidth = bitmap.width;
      finalHeight = bitmap.height;
    }

    let canvas: OffscreenCanvas | HTMLCanvasElement;
    let ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(finalWidth, finalHeight);
      ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    } else {
      canvas = document.createElement('canvas');
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      ctx = canvas.getContext('2d')!;
    }

    if (!ctx) {
      bitmap.close();
      throw new Error('无法获取 canvas 上下文');
    }

    onProgress?.(15);

    if (!keepOriginal && fitMode === 'cover') {
      const scale = Math.max(finalWidth / bitmap.width, finalHeight / bitmap.height);
      const scaledWidth = bitmap.width * scale;
      const scaledHeight = bitmap.height * scale;
      const offsetX = (finalWidth - scaledWidth) / 2;
      const offsetY = (finalHeight - scaledHeight) / 2;
      ctx.drawImage(bitmap, offsetX, offsetY, scaledWidth, scaledHeight);

    } else if (!keepOriginal && fitMode === 'contain') {
      const scale = Math.min(finalWidth / bitmap.width, finalHeight / bitmap.height);
      const drawWidth = Math.round(bitmap.width * scale);
      const drawHeight = Math.round(bitmap.height * scale);
      const offsetX = (finalWidth - drawWidth) / 2;
      const offsetY = (finalHeight - drawHeight) / 2;
      ctx.drawImage(bitmap, offsetX, offsetY, drawWidth, drawHeight);

    } else {
      ctx.drawImage(bitmap, 0, 0, finalWidth, finalHeight);
    }

    bitmap.close();
    onProgress?.(20);

    const imageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
    onProgress?.(25);

    const bmpData = encodeBmpFromRGBA(imageData.data, finalWidth, finalHeight, (progress) => {
      if (onProgress) {
        onProgress(25 + progress * 0.25);
      }
    });

    onProgress?.(50);
    return bmpData;

  } catch {
    return imageFileToBmpFallback(file, targetWidth, targetHeight, keepOriginal, fitMode, onProgress);
  }
}

/**
 * 原始实现作为回退方案
 */
async function imageFileToBmpFallback(
  file: File,
  targetWidth: number,
  targetHeight: number,
  keepOriginal: boolean,
  fitMode: 'cover' | 'contain' | 'stretch',
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      onProgress?.(10);

      const canvas = document.createElement('canvas');

      const finalWidth = keepOriginal ? img.width : targetWidth;
      const finalHeight = keepOriginal ? img.height : targetHeight;

      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法获取 canvas 上下文'));
        return;
      }

      onProgress?.(15);

      if (!keepOriginal && fitMode === 'cover') {
        const scale = Math.max(finalWidth / img.width, finalHeight / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (finalWidth - scaledWidth) / 2;
        const offsetY = (finalHeight - scaledHeight) / 2;
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      } else if (!keepOriginal && fitMode === 'contain') {
        const scale = Math.min(finalWidth / img.width, finalHeight / img.height);
        const drawWidth = Math.round(img.width * scale);
        const drawHeight = Math.round(img.height * scale);
        const offsetX = (finalWidth - drawWidth) / 2;
        const offsetY = (finalHeight - drawHeight) / 2;
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      } else {
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
      }

      onProgress?.(20);

      const imageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
      onProgress?.(25);

      const bmpData = encodeBmpFromRGBA(imageData.data, finalWidth, finalHeight, (progress) => {
        if (onProgress) {
          onProgress(25 + progress * 0.25);
        }
      });

      onProgress?.(50);
      resolve(bmpData);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };

    img.src = url;
  });
}
