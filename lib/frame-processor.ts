export type CapturedFrame = { blob: Blob; canvas: HTMLCanvasElement; width: number; height: number };

export async function captureFrame(video: HTMLVideoElement): Promise<CapturedFrame> {
  const canvas = document.createElement("canvas"); const sourceWidth = video.videoWidth || 1024; const sourceHeight = video.videoHeight || 768; const scale = Math.min(1, 1024 / Math.max(sourceWidth, sourceHeight)); canvas.width = Math.round(sourceWidth * scale); canvas.height = Math.round(sourceHeight * scale);
  const context = canvas.getContext("2d"); if (!context) throw new Error("Camera frame unavailable"); context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Frame unavailable")), "image/jpeg", .78));
  return { blob, canvas, width: canvas.width, height: canvas.height };
}

// Re-encoding strips EXIF and keeps temporary uploads within the recognition limit.
export async function compressImage(image: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(image); const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height)); const canvas = document.createElement("canvas"); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d"); if (!context) throw new Error("Image processing unavailable"); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Image processing unavailable")), "image/jpeg", .78)); canvas.width = 0; canvas.height = 0; return blob;
}
