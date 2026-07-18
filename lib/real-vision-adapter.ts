import { normalizeConcept } from "@/lib/recognition";
import { isScene } from "@/lib/scenes";
import { LanguageCode, RecognitionCandidate, RecognitionResult, SceneCategory } from "@/lib/types";
import { candidateFor } from "@/lib/recognition";

type ProviderCandidate = { canonical_concept?: unknown; confidence?: unknown; scene?: unknown; notes?: unknown };
type ProviderPayload = { object_candidates?: unknown };
const prompt = `You are a visual object naming system for language immersion. Inspect one image containing one everyday object. Return strict JSON only: {"object_candidates":[{"canonical_concept":"","confidence":0,"scene":"","notes":""}]}. Use common household concepts, never brands, decorative descriptions, paragraphs, or markdown. Return more than one candidate only when genuinely uncertain.`;
const error = (requestId:string,code:Extract<RecognitionResult,{status:"error"}>["code"],message:string):RecognitionResult=>({requestId,status:"error",code,message});
const number = (value:unknown)=>typeof value==="number"?value:typeof value==="string"?Number(value):NaN;
function candidateFromProvider(value:ProviderCandidate,language:LanguageCode):RecognitionCandidate|undefined{if(typeof value.canonical_concept!=="string")return;const concept=normalizeConcept(value.canonical_concept);if(!concept)return;const confidence=number(value.confidence);if(!Number.isFinite(confidence)||confidence<0||confidence>1)return;const candidate=candidateFor(concept.id,language,confidence);return {...candidate,sceneSuggestion:typeof value.scene==="string"&&isScene(value.scene)?value.scene:concept.defaultScene};}
function parseContent(raw:unknown):ProviderPayload|undefined{if(typeof raw!=="string")return;try{const value=JSON.parse(raw);return value&&typeof value==="object"?value as ProviderPayload:undefined;}catch{return;}}
export class RealVisionAdapter{
  async recognize({image,language,requestId}:{image:File;language:LanguageCode;requestId:string}):Promise<RecognitionResult>{
    const base=process.env.VISION_API_BASE_URL?.replace(/\/$/,"");const key=process.env.VISION_API_KEY;const model=process.env.VISION_MODEL;const provider=process.env.VISION_PROVIDER;
    if(!base||!key||!model||provider!=="openai_compatible")return error(requestId,"PROVIDER_ERROR","Recognition is unavailable.");
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
    try{const bytes=Buffer.from(await image.arrayBuffer());const response=await fetch(`${base}/chat/completions`,{method:"POST",signal:controller.signal,headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model,temperature:0,response_format:{type:"json_object"},messages:[{role:"system",content:prompt},{role:"user",content:[{type:"text",text:"Name the central everyday object."},{type:"image_url",image_url:{url:`data:${image.type||"image/jpeg"};base64,${bytes.toString("base64")}`}}]}]})});if(!response.ok)return error(requestId,"PROVIDER_ERROR","Recognition is unavailable.");const payload=await response.json() as {choices?:Array<{message?:{content?:unknown}}>;};const parsed=parseContent(payload.choices?.[0]?.message?.content);if(!Array.isArray(parsed?.object_candidates))return error(requestId,"INVALID_RESPONSE","Recognition is unavailable.");const candidates=parsed.object_candidates.slice(0,3).map(item=>candidateFromProvider(item as ProviderCandidate,language)).filter((item):item is RecognitionCandidate=>Boolean(item));if(!candidates.length)return error(requestId,"NO_CLEAR_OBJECT","I couldn't name this clearly.");const [primary]=candidates;if(candidates.length>1||primary.confidence<.72)return{requestId,status:"needs_confirmation",confidence:primary.confidence,primary:null,candidates};return{requestId,status:"confirmed",confidence:primary.confidence,primary,candidates:[]};
    }catch(cause){return error(requestId,(cause as Error).name==="AbortError"?"TIMEOUT":"NETWORK_ERROR","Recognition is unavailable.");}finally{clearTimeout(timeout);}
  }
}
