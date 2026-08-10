import { candidateFor, normalizeConcept } from "@/lib/recognition";
import { isScene } from "@/lib/scenes";
import { LanguageCode, RecognitionCandidate, RecognitionResult } from "@/lib/types";
import { VisionAdapter, VisionEvaluation, VisionRecognitionInput } from "@/lib/vision-adapter";

type ProviderCandidate = { concept?: unknown; confidence?: unknown; scene?: unknown };
type ProviderPayload = { candidates?: unknown };
const prompt = `You are an everyday object recognition system. Inspect one image containing one everyday object. Return strict JSON only: {"candidates":[{"concept":"mug","confidence":0.9,"scene":"kitchen"}]}. Prefer common vocabulary. Never use brand names, product names, decorative descriptions, overly specific taxonomy, markdown, or prose. Return more than one candidate only when genuinely uncertain.`;
const error = (requestId:string,code:Extract<RecognitionResult,{status:"error"}>["code"],message:string):RecognitionResult=>({requestId,status:"error",code,message});
const number = (value:unknown)=>typeof value==="number"?value:typeof value==="string"?Number(value):NaN;
function candidateFromProvider(value:ProviderCandidate,language:LanguageCode):RecognitionCandidate|undefined{if(typeof value.concept!=="string")return;const concept=normalizeConcept(value.concept);if(!concept)return;const confidence=number(value.confidence);if(!Number.isFinite(confidence)||confidence<0||confidence>1)return;const candidate=candidateFor(concept.id,language,confidence);return {...candidate,sceneSuggestion:typeof value.scene==="string"&&isScene(value.scene)?value.scene:concept.defaultScene};}
function parseContent(raw:unknown):ProviderPayload|undefined{if(typeof raw!=="string")return;try{const value=JSON.parse(raw);return value&&typeof value==="object"?value as ProviderPayload:undefined;}catch{return;}}
function toResult(payload:ProviderPayload|undefined,language:LanguageCode,requestId:string):RecognitionResult{if(!Array.isArray(payload?.candidates))return error(requestId,"INVALID_RESPONSE","Recognition is unavailable.");const candidates=payload.candidates.slice(0,3).map(item=>candidateFromProvider(item as ProviderCandidate,language)).filter((item):item is RecognitionCandidate=>Boolean(item));if(!candidates.length)return error(requestId,"NO_CLEAR_OBJECT","I couldn't name this clearly.");const [primary]=candidates;if(candidates.length>1||primary.confidence<.72)return{requestId,status:"needs_confirmation",confidence:primary.confidence,primary:null,candidates};return{requestId,status:"confirmed",confidence:primary.confidence,primary,candidates:[]};}

export class RealVisionAdapter implements VisionAdapter {
  async recognize(input:VisionRecognitionInput):Promise<RecognitionResult>{return (await this.recognizeForEvaluation(input)).result;}

  async recognizeForEvaluation({image,language,requestId}:VisionRecognitionInput):Promise<VisionEvaluation>{
    const key=process.env.VISION_API_KEY; const model=process.env.VISION_MODEL; const provider=process.env.VISION_PROVIDER;
    if(!key||!model||provider!=="gemini")return {result:error(requestId,"PROVIDER_ERROR","Recognition is unavailable."),rawResponse:{error:"Gemini is not configured."},diagnostics:{providerDurationMs:0}};
    const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),8000);
    const startedAt=Date.now();
    try{
      const bytes=Buffer.from(await image.arrayBuffer()); const mimeType=image.type||"image/jpeg";
      const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{method:"POST",signal:controller.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({systemInstruction:{parts:[{text:prompt}]},generationConfig:{temperature:0,responseMimeType:"application/json"},contents:[{role:"user",parts:[{text:"Name the central everyday object."},{inlineData:{mimeType,data:bytes.toString("base64")}}]}]})});
      const rawResponse=await response.json().catch(()=>({error:"Provider returned a non-JSON response."}));
      if(!response.ok)return {result:error(requestId,"PROVIDER_ERROR","Recognition is unavailable."),rawResponse:{status:response.status},diagnostics:{providerDurationMs:Date.now()-startedAt}};
      const payload=rawResponse as {candidates?:Array<{content?:{parts?:Array<{text?:unknown}>}}>} ;
      const text=payload.candidates?.[0]?.content?.parts?.map(part=>typeof part.text==="string"?part.text:"").join("");
      return {result:toResult(parseContent(text),language,requestId),rawResponse,diagnostics:{providerDurationMs:Date.now()-startedAt}};
    }catch(cause){return {result:error(requestId,(cause as Error).name==="AbortError"?"TIMEOUT":"NETWORK_ERROR","Recognition is unavailable."),rawResponse:{error:(cause as Error).name==="AbortError"?"Request timed out.":"Network request failed."},diagnostics:{providerDurationMs:Date.now()-startedAt}};}finally{clearTimeout(timeout);}
  }
}
