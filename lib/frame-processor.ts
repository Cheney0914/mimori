export async function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  const canvas = document.createElement("canvas"); const sourceWidth = video.videoWidth || 1024; const sourceHeight = video.videoHeight || 768; const scale = Math.min(1, 1024 / Math.max(sourceWidth, sourceHeight)); canvas.width = Math.round(sourceWidth * scale); canvas.height = Math.round(sourceHeight * scale);
  const context = canvas.getContext("2d"); if (!context) throw new Error("Camera frame unavailable"); context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Frame unavailable")), "image/jpeg", .78)); canvas.width = 0; canvas.height = 0; return blob;
}
