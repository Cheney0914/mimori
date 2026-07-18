import { concepts, getConcept } from "@/lib/concepts";
import { LanguageCode, RecognitionCandidate, RecognitionResult } from "@/lib/types";
const aliases:Record<string,string>={"coffee cup with handle":"mug","ceramic coffee mug":"mug","drink cup":"mug","coffee cup":"mug","rain umbrella":"umbrella"};
export const normalizeConcept = (raw: string) => {const key=raw.trim().toLowerCase();const normalized=aliases[key]??key;return concepts.find((item) => [item.id, item.canonicalName, ...item.aliases].some((alias) => alias.toLowerCase() === normalized));};
export const candidateFor = (conceptId: string, language: LanguageCode, confidence = .91): RecognitionCandidate => { const concept = getConcept(conceptId) ?? concepts[0]; return { conceptId: concept.id, canonicalName: concept.canonicalName, confidence, sceneSuggestion: concept.defaultScene, localized: concept.terms[language] }; };
export function mockRecognition(language: LanguageCode, requestId: string): RecognitionResult {
  // Deliberately deterministic: every first mock scan resolves to mug; add ?ambiguous=1 for UI/API testing.
  return { requestId, status: "confirmed", confidence: .91, primary: candidateFor("mug", language), candidates: [] };
}
export function mockCandidates(language: LanguageCode, requestId: string): RecognitionResult { return { requestId,status:"needs_confirmation",confidence:.61,primary:null,candidates:[candidateFor("mug",language,.61),candidateFor("whisk",language,.24)].slice(0,3) }; }
export const parseRecognition = (data: unknown): RecognitionResult | null => {
  if (!data || typeof data !== "object" || !("status" in data) || !("requestId" in data)) return null;
  const result = data as RecognitionResult;
  if (result.status === "confirmed" && result.primary?.localized?.language && typeof result.confidence === "number") return result;
  if (result.status === "needs_confirmation" && Array.isArray(result.candidates)) return result;
  if (result.status === "error" && typeof result.message === "string") return result;
  return null;
};
