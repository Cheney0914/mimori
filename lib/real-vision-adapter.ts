import { candidateFor, normalizeConcept } from "@/lib/recognition";
import { isScene } from "@/lib/scenes";
import { LanguageCode, RecognitionCandidate, RecognitionResult } from "@/lib/types";
import { RecognitionDiagnostics, VisionAdapter, VisionErrorClass, VisionEvaluation, VisionRecognitionInput } from "@/lib/vision-adapter";
import { DEFAULT_VISION_MODEL } from "@/lib/vision-model";

type ProviderCandidate = { concept?: unknown; confidence?: unknown; scene?: unknown };
type ProviderPayload = { candidates?: unknown };
type GeminiError = { error?: { code?: unknown; status?: unknown; message?: unknown } };
type GeminiUsage = { usageMetadata?: { promptTokenCount?: unknown; candidatesTokenCount?: unknown; totalTokenCount?: unknown } };
type ProviderAttempt = { response?: Response; rawResponse?: unknown; errorClass?: VisionErrorClass; localAbortFired?: boolean; providerDurationMs: number };
const prompt = `You are an everyday object recognition system. Inspect one image containing one everyday object. Return strict JSON only: {"candidates":[{"concept":"mug","confidence":0.9,"scene":"kitchen"}]}. Prefer common vocabulary. Never use brand names, product names, decorative descriptions, overly specific taxonomy, markdown, or prose. Return more than one candidate only when genuinely uncertain.`;
const error = (requestId:string,code:Extract<RecognitionResult,{status:"error"}>["code"],message:string):RecognitionResult=>({requestId,status:"error",code,message});
const number = (value:unknown)=>typeof value==="number"?value:typeof value==="string"?Number(value):NaN;
const wholeNumber = (value:unknown) => { const parsed=number(value); return Number.isInteger(parsed)&&parsed>=0?parsed:undefined; };
const configuredMs = (name:string, fallback:number) => { const value=Number(process.env[name]); return Number.isFinite(value)&&value>0?value:fallback; };
const safeMessage = (value:unknown) => typeof value==="string" ? value.slice(0, 240) : undefined;
function candidateFromProvider(value:ProviderCandidate,language:LanguageCode):RecognitionCandidate|undefined{if(typeof value.concept!=="string")return;const concept=normalizeConcept(value.concept);if(!concept)return;const confidence=number(value.confidence);if(!Number.isFinite(confidence)||confidence<0||confidence>1)return;const candidate=candidateFor(concept.id,language,confidence);return {...candidate,sceneSuggestion:typeof value.scene==="string"&&isScene(value.scene)?value.scene:concept.defaultScene};}
function parseContent(raw:unknown):ProviderPayload|undefined{if(typeof raw!=="string")return;try{const value=JSON.parse(raw);return value&&typeof value==="object"?value as ProviderPayload:undefined;}catch{return;}}
function toResult(payload:ProviderPayload|undefined,language:LanguageCode,requestId:string):RecognitionResult{if(!Array.isArray(payload?.candidates))return error(requestId,"INVALID_RESPONSE","Recognition is unavailable.");const candidates=payload.candidates.slice(0,3).map(item=>candidateFromProvider(item as ProviderCandidate,language)).filter((item):item is RecognitionCandidate=>Boolean(item));if(!candidates.length)return error(requestId,"NO_CLEAR_OBJECT","I couldn't name this clearly.");const [primary]=candidates;if(candidates.length>1||primary.confidence<.72)return{requestId,status:"needs_confirmation",confidence:primary.confidence,primary:null,candidates};return{requestId,status:"confirmed",confidence:primary.confidence,primary,candidates:[]};}
function isTransient(errorClass:VisionErrorClass|undefined, status?:number){return errorClass==="PROVIDER_TIMEOUT"||errorClass==="NETWORK_ERROR"||status===408||status===429||Boolean(status&&status>=500);}

export class RealVisionAdapter implements VisionAdapter {
  async recognize(input:VisionRecognitionInput):Promise<RecognitionResult>{return (await this.run({...input,evaluation:false})).result;}
  async recognizeForEvaluation(input:VisionRecognitionInput):Promise<VisionEvaluation>{return this.run({...input,evaluation:true});}

  private async providerRequest(url:string, body:string, timeoutMs:number):Promise<ProviderAttempt>{
    const controller=new AbortController(); let localAbortFired=false; const startedAt=Date.now(); const timeout=setTimeout(()=>{localAbortFired=true;controller.abort();},timeoutMs);
    try { const response=await fetch(url,{method:"POST",signal:controller.signal,headers:{"Content-Type":"application/json"},body}); const rawResponse=await response.json().catch(()=>({error:{message:"Provider returned a non-JSON response."}})); return {response,rawResponse,providerDurationMs:Date.now()-startedAt};
    } catch (cause) { return {errorClass:localAbortFired?"PROVIDER_TIMEOUT":"NETWORK_ERROR",localAbortFired,providerDurationMs:Date.now()-startedAt};
    } finally { clearTimeout(timeout); }
  }

  private async run({image,language,requestId,evaluation,modelOverride}:VisionRecognitionInput):Promise<VisionEvaluation>{
    const startedAt=Date.now(); const key=process.env.VISION_API_KEY; const model=evaluation&&modelOverride?modelOverride:(process.env.VISION_MODEL||DEFAULT_VISION_MODEL); const provider=process.env.VISION_PROVIDER;
    if(!key||provider!=="gemini")return {result:error(requestId,"PROVIDER_ERROR","Recognition is unavailable."),rawResponse:{error:"Gemini is not configured."},diagnostics:{providerDurationMs:0,parsingDurationMs:0,normalizationDurationMs:0,totalDurationMs:Date.now()-startedAt,retryCount:0,errorClass:"INVALID_RESPONSE"}};
    const providerTimeoutMs=configuredMs(evaluation?"VISION_EVALUATION_PROVIDER_TIMEOUT_MS":"VISION_PROVIDER_TIMEOUT_MS",evaluation?20000:8000);
    const bytes=Buffer.from(await image.arrayBuffer()); const mimeType=image.type||"image/jpeg";
    const generationConfig:{temperature?:number;responseMimeType:string;maxOutputTokens:number;thinkingConfig?:{thinkingBudget?:number;thinkingLevel?:"minimal"|"low"|"medium"|"high"}}={responseMimeType:"application/json",maxOutputTokens:128};
    if(model.includes("gemini-3")) generationConfig.thinkingConfig={thinkingLevel:"minimal"};
    else { generationConfig.temperature=0; if(model.includes("gemini-2.5")&&process.env.VISION_THINKING_BUDGET!=="") generationConfig.thinkingConfig={thinkingBudget:configuredMs("VISION_THINKING_BUDGET",0)}; }
    const body=JSON.stringify({systemInstruction:{parts:[{text:prompt}]},generationConfig,contents:[{role:"user",parts:[{text:"Name the central everyday object."},{inlineData:{mimeType,data:bytes.toString("base64")}}]}]});
    const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    let attempt=0; let providerDurationMs=0; let latest:ProviderAttempt;
    do { latest=await this.providerRequest(url,body,providerTimeoutMs); providerDurationMs+=latest.providerDurationMs; if(!isTransient(latest.errorClass,latest.response?.status)||attempt===1)break; await new Promise(resolve=>setTimeout(resolve,500+Math.floor(Math.random()*501))); attempt+=1; } while(true);
    const response=latest!; const upstream=response.rawResponse as GeminiError|undefined; const upstreamStatus=response.response?.status;
    const usage=response.rawResponse as GeminiUsage|undefined;
    const errorClass:VisionErrorClass|undefined=response.errorClass||(!response.response?.ok?(upstreamStatus===408?"PROVIDER_TIMEOUT":upstreamStatus===429?"UPSTREAM_429":upstreamStatus&&upstreamStatus>=500?"UPSTREAM_5XX":"UPSTREAM_4XX"):undefined);
    const outgoingRequestConfig={apiVersion:"v1beta" as const,generationConfig,hasSystemInstruction:true,contentPartKinds:["text","inlineData"] as ["text","inlineData"]};
    const baseDiagnostics:RecognitionDiagnostics={providerDurationMs,parsingDurationMs:0,normalizationDurationMs:0,totalDurationMs:Date.now()-startedAt,retryCount:attempt,errorClass,upstreamHttpStatus:upstreamStatus,providerCode:typeof upstream?.error?.status==="string"?upstream.error.status:undefined,providerMessage:safeMessage(upstream?.error?.message),localAbortFired:response.localAbortFired,outgoingRequestConfig,promptTokenCount:wholeNumber(usage?.usageMetadata?.promptTokenCount),outputTokenCount:wholeNumber(usage?.usageMetadata?.candidatesTokenCount),totalTokenCount:wholeNumber(usage?.usageMetadata?.totalTokenCount)};
    if(!response.response?.ok)return {result:error(requestId,errorClass==="PROVIDER_TIMEOUT"?"TIMEOUT":errorClass==="NETWORK_ERROR"?"NETWORK_ERROR":"PROVIDER_ERROR","Recognition is unavailable."),rawResponse:{upstreamHttpStatus:upstreamStatus,providerCode:baseDiagnostics.providerCode,providerMessage:baseDiagnostics.providerMessage,localAbortFired:response.localAbortFired},diagnostics:baseDiagnostics};
    const parsingStartedAt=Date.now(); const payload=response.rawResponse as {candidates?:Array<{content?:{parts?:Array<{text?:unknown}>}}>} ; const text=payload.candidates?.[0]?.content?.parts?.map(part=>typeof part.text==="string"?part.text:"").join(""); const parsed=parseContent(text); const parsingDurationMs=Date.now()-parsingStartedAt;
    const normalizationStartedAt=Date.now(); const result=toResult(parsed,language,requestId); const normalizationDurationMs=Date.now()-normalizationStartedAt;
    const rawPrimary=Array.isArray(parsed?.candidates)?parsed.candidates[0] as ProviderCandidate|undefined:undefined; const rawVisionConcept=typeof rawPrimary?.concept==="string"?rawPrimary.concept.trim().slice(0,120):undefined; const rawConfidence=number(rawPrimary?.confidence); const providerRecognized=Boolean(rawVisionConcept&&Number.isFinite(rawConfidence)&&rawConfidence>=.72); const unsupportedConcept=providerRecognized&&result.status==="error"&&result.code==="NO_CLEAR_OBJECT";
    return {result,rawResponse:response.rawResponse,diagnostics:{...baseDiagnostics,parsingDurationMs,normalizationDurationMs,totalDurationMs:Date.now()-startedAt,rawVisionConcept,recognitionStatus:providerRecognized?"recognized":"not_recognized",normalizationStatus:unsupportedConcept?"unsupported concept":result.status==="confirmed"||result.status==="needs_confirmation"?"matched":"no controlled concept match",suggestedEvaluationType:unsupportedConcept?"UNKNOWN_CONCEPT":undefined}};
  }
}
