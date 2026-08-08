import { LanguageCode, RecognitionResult } from "@/lib/types";

export type VisionRecognitionInput = { image: Blob; language: LanguageCode; requestId: string };
export type VisionEvaluation = { result: RecognitionResult; rawResponse: unknown };

// The application depends only on this boundary; provider request/response shapes stay behind it.
export interface VisionAdapter {
  recognize(input: VisionRecognitionInput): Promise<RecognitionResult>;
  recognizeForEvaluation(input: VisionRecognitionInput): Promise<VisionEvaluation>;
}
