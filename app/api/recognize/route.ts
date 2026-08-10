import { NextRequest, NextResponse } from "next/server";
import { recognitionService } from "@/lib/recognition-service";
import { LanguageCode } from "@/lib/types";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const recognitionMode = process.env.RECOGNITION_MODE === "real" ? "real" : "mock";
  const provider = recognitionMode === "real" ? (process.env.VISION_PROVIDER || "unconfigured") : "mock";
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
      const evaluation=await recognitionService.recognizeForEvaluation(input);
      providerDurationMs=evaluation.diagnostics.providerDurationMs; normalizedStatus=evaluation.result.status; errorCode=evaluation.result.status==="error"?evaluation.result.code:undefined;
      return NextResponse.json(evaluation,{status:evaluation.result.status==="error"?503:200,headers:{"X-Robots-Tag":"noindex, nofollow"}});
    }
    const evaluation=await recognitionService.recognizeForEvaluation(input);
    const result=evaluation.result; providerDurationMs=evaluation.diagnostics.providerDurationMs; normalizedStatus=result.status; errorCode=result.status==="error"?result.code:undefined;
    return NextResponse.json(result,{status:result.status==="error"?503:200});
  } catch { errorCode="INVALID_RESPONSE"; return NextResponse.json({ requestId, status: "error", code: errorCode, message: "Unable to read this scan." }, { status: 400 });
  } finally {
    console.info("recognition_timing", { requestId, recognitionMode, provider, startedAt: new Date(startedAt).toISOString(), providerDurationMs, totalDurationMs: Date.now()-startedAt, normalizedStatus, errorCode });
  }
}
