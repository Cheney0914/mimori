export type LanguageCode = "en" | "ja";
export type SceneCategory = "kitchen" | "food_drink" | "home" | "bathroom" | "work_study" | "clothing_personal" | "outside" | "other";

export type LocalizedTerm = { language: LanguageCode; displayTerm: string; pronunciation?: string; kana?: string; romaji?: string; broaderTerm?: string };
export type RecognitionCandidate = { conceptId: string; canonicalName: string; confidence: number; sceneSuggestion: SceneCategory; localized: LocalizedTerm };
export type RecognitionResult =
  | { requestId: string; status: "confirmed"; confidence: number; primary: RecognitionCandidate; candidates: [] }
  | { requestId: string; status: "needs_confirmation"; confidence: number; primary: null; candidates: RecognitionCandidate[] }
  | { requestId: string; status: "error"; code: "NO_CLEAR_OBJECT" | "MULTIPLE_OBJECTS" | "NETWORK_ERROR" | "TIMEOUT" | "PROVIDER_ERROR" | "INVALID_RESPONSE"; message: string };

export type ConceptSeed = { id: string; canonicalName: string; aliases: string[]; defaultScene: SceneCategory; terms: Record<LanguageCode, LocalizedTerm> };
export type UserConcept = { id: string; conceptId: string; language: LanguageCode; scene: SceneCategory; encounterCount: number; firstSeenAt: string; lastSeenAt: string; term: LocalizedTerm };
export type UserConceptScene = { id: string; conceptId: string; language: LanguageCode; scene: SceneCategory; encounterCount: number; firstSeenAt: string; lastSeenAt: string };
export type EncounterTransaction = { concept: UserConcept; scene: SceneCategory; undone: boolean };
export type Preferences = { onboardingComplete: boolean; language?: LanguageCode };
