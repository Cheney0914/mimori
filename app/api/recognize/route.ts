import { NextRequest, NextResponse } from "next/server";
import { recognitionService } from "@/lib/recognition-service";
import { LanguageCode } from "@/lib/types";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const form = await request.formData(); const image = form.get("image"); const language = form.get("language");
    if (!(image instanceof File)) return NextResponse.json({ requestId, status: "error", code: "INVALID_RESPONSE", message: "An image is required." }, { status: 400 });
    if (image.size > 750_000) return NextResponse.json({ requestId, status: "error", code: "INVALID_RESPONSE", message: "Image is too large." }, { status: 413 });
    if (language !== "en" && language !== "ja") return NextResponse.json({ requestId, status: "error", code: "INVALID_RESPONSE", message: "Unsupported language." }, { status: 400 });
    const input={image,language:language as LanguageCode,requestId};
    if(request.nextUrl.searchParams.get("evaluation")==="1"){
      const evaluationAllowed=process.env.NODE_ENV!=="production"||process.env.VERCEL_ENV==="preview"||process.env.VISION_PLAYGROUND_ENABLED==="true";
      if(!evaluationAllowed)return NextResponse.json({requestId,status:"error",code:"PROVIDER_ERROR",message:"Recognition is unavailable."},{status:404,headers:{"X-Robots-Tag":"noindex, nofollow"}});
      const evaluation=await recognitionService.recognizeForEvaluation(input);
      return NextResponse.json(evaluation,{status:evaluation.result.status==="error"?503:200,headers:{"X-Robots-Tag":"noindex, nofollow"}});
    }
    const result=await recognitionService.recognize(input);
    return NextResponse.json(result,{status:result.status==="error"?503:200});
  } catch { return NextResponse.json({ requestId, status: "error", code: "INVALID_RESPONSE", message: "Unable to read this scan." }, { status: 400 }); }
}
