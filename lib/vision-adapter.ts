import { LanguageCode, RecognitionResult } from "@/lib/types";

export type VisionRecognitionInput = { image: Blob; language: LanguageCode; requestId: string; evaluation?: boolean };
export type VisionErrorClass = "PROVIDER_TIMEOUT" | "CLIENT_TIMEOUT" | "UPSTREAM_429" | "UPSTREAM_5XX" | "NETWORK_ERROR" | "UPSTREAM_4XX" | "INVALID_RESPONSE";
export type RecognitionDiagnostics = {
  providerDurationMs: number;
  parsingDurationMs: number;
  normalizationDurationMs: number;
  totalDurationMs: number;
  retryCount: number;
  errorClass?: VisionErrorClass;
  upstreamHttpStatus?: number;
  providerCode?: string;
  providerMessage?: string;
  localAbortFired?: boolean;
};
export type VisionEvaluation = { result: RecognitionResult; rawResponse: unknown; diagnostics: RecognitionDiagnostics };

// The application depends only on this boundary; provider request/response shapes stay behind it.
export interface VisionAdapter {
  recognize(input: VisionRecognitionInput): Promise<RecognitionResult>;
  recognizeForEvaluation(input: VisionRecognitionInput): Promise<VisionEvaluation>;
}
