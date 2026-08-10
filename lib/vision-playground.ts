export const visionPlaygroundModels = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"] as const;
export type VisionPlaygroundModel = typeof visionPlaygroundModels[number];
export const isVisionPlaygroundModel = (value: unknown): value is VisionPlaygroundModel => typeof value === "string" && (visionPlaygroundModels as readonly string[]).includes(value);
