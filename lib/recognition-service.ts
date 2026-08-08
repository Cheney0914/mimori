import { mockCandidates, mockRecognition } from "@/lib/recognition";
import { RealVisionAdapter } from "@/lib/real-vision-adapter";
import { VisionAdapter, VisionEvaluation, VisionRecognitionInput } from "@/lib/vision-adapter";
export type RecognitionInput=VisionRecognitionInput;
class MockVisionAdapter implements VisionAdapter{async recognize({language,requestId}:RecognitionInput){const ambiguous=process.env.VERCEL_ENV!=="production"&&process.env.MOCK_RECOGNITION_SCENARIO==="ambiguous";return ambiguous?mockCandidates(language,requestId):mockRecognition(language,requestId);}async recognizeForEvaluation(input:RecognitionInput):Promise<VisionEvaluation>{return{result:await this.recognize(input),rawResponse:{provider:"mock",note:"Deterministic local mock response; no image was uploaded."}}}}
export const recognitionService:VisionAdapter=process.env.RECOGNITION_MODE==="real"?new RealVisionAdapter():new MockVisionAdapter();
