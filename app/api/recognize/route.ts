import { NextRequest, NextResponse } from "next/server";
import { recognitionService } from "@/lib/recognition-service";
import { LanguageCode } from "@/lib/types";
import { isVisionPlaygroundModel } from "@/lib/vision-playground";
import { DEFAULT_VISION_MODEL } from "@/lib/vision-model";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const recognitionMode = process.env.RECOGNITION_MODE === "real" ? "real" : "mock";
  const provider = recognitionMode === "real" ? (process.env.VISION_PROVIDER || "unconfigured") : "mock";
  const configuredModel = recognitionMode === "real" ? (process.env.VISION_MODEL || DEFAULT_VISION_MODEL) : "mock";
  let providerDurationMs = 0;
  let normalizedStatus = "error";
  let errorCode: string | undefined;
  try {
    const form = await request.formData(); const image = form.get("image"); const language = form.get("language");
    if (!(image instanceof File)) { errorCode="INVALID_RESPONSE"; return NextResponse.json({ requestId, status: "error", code: errorCode, message: "An image is required." }, { status: 400 }); }
    if (image.size > 750_000) { errorCode="INVALID_RESPONSE"; return NextResponse.json({ requestId, status: "error", code: errorCode, message: "Image is too large." }, { status: 413 }); }
    if (language !== "en" && language !== "ja") { errorCode="INVALID_RESPONSE"; return NextResponse.json({ requestId, status: "error", code: errorCode, message: "Unsupported language." }, { status: 400 }); }
    const input={image,language:language as LanguageCode,requestId};
    if(request.nextUrl.searchParams.get("evaluation")==="1"){
      const evaluationAllowed=process.env.NODE_ENV!=="production"||process.env.VERCEL_ENV==="preview"||process.env.VISION_PLAYGROUND_ENABLED==="true";
      if(!evaluationAllowed)return NextResponse.json({requestId,status:"error",code:"PROVIDER_ERROR",message:"Recognition is unavailable."},{status:404,headers:{"X-Robots-Tag":"noindex, nofollow"}});
      const requestedModel=form.get("playgroundModel");
      if(requestedModel!==null&&!isVisionPlaygroundModel(requestedModel)){errorCode="INVALID_RESPONSE";return NextResponse.json({requestId,status:"error",code:errorCode,message:"Unsupported playground model."},{status:400,headers:{"X-Robots-Tag":"noindex, nofollow"}});}
      const model=recognitionMode === "real" ? (requestedModel || configuredModel) : "mock";
      const evaluation=await recognitionService.recognizeForEvaluation({...input,evaluation:true,modelOverride:requestedModel||undefined});
      providerDurationMs=evaluation.diagnostics.providerDurationMs; normalizedStatus=evaluation.result.status; errorCode=evaluation.result.status==="error"?evaluation.result.code:undefined;
      return NextResponse.json({...evaluation,debug:{recognitionMode,provider,model,requestId,providerDurationMs,serverTotalDurationMs:Date.now()-startedAt,retryCount:evaluation.diagnostics.retryCount,finalStatus:evaluation.result.status,errorClass:evaluation.diagnostics.errorClass,upstreamHttpStatus:evaluation.diagnostics.upstreamHttpStatus,providerCode:evaluation.diagnostics.providerCode,providerMessage:evaluation.diagnostics.providerMessage,localAbortFired:evaluation.diagnostics.localAbortFired,parsingDurationMs:evaluation.diagnostics.parsingDurationMs,normalizationDurationMs:evaluation.diagnostics.normalizationDurationMs,outgoingRequestConfig:evaluation.diagnostics.outgoingRequestConfig,promptTokenCount:evaluation.diagnostics.promptTokenCount,outputTokenCount:evaluation.diagnostics.outputTokenCount,totalTokenCount:evaluation.diagnostics.totalTokenCount,rawVisionConcept:evaluation.diagnostics.rawVisionConcept,recognitionStatus:evaluation.diagnostics.recognitionStatus,normalizationStatus:evaluation.diagnostics.normalizationStatus,suggestedEvaluationType:evaluation.diagnostics.suggestedEvaluationType}},{status:evaluation.result.status==="error"?503:200,headers:{"X-Robots-Tag":"noindex, nofollow"}});
    }
    const evaluation=await recognitionService.recognizeForEvaluation(input);
    const result=evaluation.result; providerDurationMs=evaluation.diagnostics.providerDurationMs; normalizedStatus=result.status; errorCode=result.status==="error"?result.code:undefined;
    return NextResponse.json(result,{status:result.status==="error"?503:200});
  } catch { errorCode="INVALID_RESPONSE"; return NextResponse.json({ requestId, status: "error", code: errorCode, message: "Unable to read this scan." }, { status: 400 });
  } finally {
    console.info("recognition_timing", { requestId, recognitionMode, provider, model: configuredModel, startedAt: new Date(startedAt).toISOString(), providerDurationMs, totalDurationMs: Date.now()-startedAt, normalizedStatus, errorCode });
  }
}
