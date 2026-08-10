export interface LocalDetection {
  bbox: { x: number; y: number; width: number; height: number };
  roughClass?: string;
  confidence: number;
}

export interface LocalObjectDetector {
  detect(source: HTMLVideoElement | HTMLCanvasElement): Promise<LocalDetection[]>;
}

/** A lazy, best-effort detector used only to place the immediate camera overlay. */
export class CocoSsdLocalObjectDetector implements LocalObjectDetector {
  private modelPromise?: Promise<{
    detect(source: HTMLVideoElement | HTMLCanvasElement): Promise<Array<{ bbox: [number, number, number, number]; class: string; score: number }>>;
  }>;

  private load() {
    this.modelPromise ??= import("@tensorflow-models/coco-ssd").then(({ load }) => load());
    return this.modelPromise;
  }

  async warm(): Promise<void> { await this.load(); }

  async detect(source: HTMLVideoElement | HTMLCanvasElement): Promise<LocalDetection[]> {
    const predictions = await (await this.load()).detect(source);
    return predictions.map(({ bbox, class: roughClass, score }) => ({
      bbox: { x: bbox[0], y: bbox[1], width: bbox[2], height: bbox[3] },
      roughClass,
      confidence: score,
    }));
  }
}

export function selectTargetDetection(detections: LocalDetection[], width: number, height: number): LocalDetection | undefined {
  const centerX = width / 2;
  const centerY = height / 2;
  const central = detections.filter(({ bbox }) => centerX >= bbox.x && centerX <= bbox.x + bbox.width && centerY >= bbox.y && centerY <= bbox.y + bbox.height);
  const candidates = central.length ? central : detections.filter(({ bbox }) => {
    const x = bbox.x + bbox.width / 2;
    const y = bbox.y + bbox.height / 2;
    return Math.abs(x - centerX) < width * .42 && Math.abs(y - centerY) < height * .42;
  });
  const pool = candidates.length ? candidates : detections;
  return pool.sort((a, b) => {
    const aDistance = Math.hypot(a.bbox.x + a.bbox.width / 2 - centerX, a.bbox.y + a.bbox.height / 2 - centerY);
    const bDistance = Math.hypot(b.bbox.x + b.bbox.width / 2 - centerX, b.bbox.y + b.bbox.height / 2 - centerY);
    return aDistance - bDistance || b.confidence - a.confidence;
  })[0];
}
