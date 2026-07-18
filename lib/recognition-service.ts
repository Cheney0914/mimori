import { mockCandidates, mockRecognition } from "@/lib/recognition";
import { RealVisionAdapter } from "@/lib/real-vision-adapter";
import { LanguageCode, RecognitionResult } from "@/lib/types";
export type RecognitionInput={image:File;language:LanguageCode;requestId:string};
export interface RecognitionService{recognize(input:RecognitionInput):Promise<RecognitionResult>}
class MockVisionAdapter implements RecognitionService{async recognize({language,requestId}:RecognitionInput){const ambiguous=process.env.VERCEL_ENV!=="production"&&process.env.MOCK_RECOGNITION_SCENARIO==="ambiguous";return ambiguous?mockCandidates(language,requestId):mockRecognition(language,requestId);}}
export const recognitionService:RecognitionService=process.env.RECOGNITION_MODE==="real"?new RealVisionAdapter():new MockVisionAdapter();
