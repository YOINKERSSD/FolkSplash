export interface SplashHeader {
  magic: string;
  metadata: Uint8Array[];
  imgnumber: number;
  unknow: number;
  width: number;
  height: number;
  special: number;
}

export interface ImageMetadata {
  offset: number;
  realsz: number;
  compsz: number;
  name: string;
}

export interface SplashImage {
  index: number;
  name: string;
  width: number;
  height: number;
  originalWidth: number; // 解包时的原始分辨率
  originalHeight: number;
  bmpData: Uint8Array;
  blob: Blob;
  previewUrl: string;
}

export interface SplashData {
  hasDDPH: boolean;
  ddphMagic?: number;
  ddphFlag?: number;
  header: SplashHeader;
  images: SplashImage[];
  originalBuffer: ArrayBuffer;
}

export interface CompressedImage {
  metadata: ImageMetadata;
  compressedData: Uint8Array;
}
