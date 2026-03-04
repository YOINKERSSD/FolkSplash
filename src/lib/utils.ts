export function readString(buffer: ArrayBuffer, offset: number, length: number): string {
  const bytes = new Uint8Array(buffer, offset, length);
  let end = bytes.indexOf(0);
  if (end === -1) end = length;
  return new TextDecoder('utf-8').decode(bytes.slice(0, end));
}

export function writeString(
  dataView: DataView,
  offset: number,
  str: string,
  maxLength: number
): void {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  for (let i = 0; i < maxLength; i++) {
    dataView.setUint8(offset + i, i < bytes.length ? bytes[i] : 0);
  }
}

export function readUint16(buffer: ArrayBuffer, offset: number): number {
  return new DataView(buffer).getUint16(offset, true);
}

export function readUint32(buffer: ArrayBuffer, offset: number): number {
  return new DataView(buffer).getUint32(offset, true);
}

export function writeUint16(dataView: DataView, offset: number, value: number): void {
  dataView.setUint16(offset, value, true);
}

export function writeUint32(dataView: DataView, offset: number, value: number): void {
  dataView.setUint32(offset, value, true);
}

export function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  let totalLength = 0;
  for (const arr of arrays) {
    totalLength += arr.length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export async function readAllChunks(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  return concatUint8Arrays(chunks);
}

export function downloadFile(data: Uint8Array, filename: string): void {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
