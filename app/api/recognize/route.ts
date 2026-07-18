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
    const result=await recognitionService.recognize({image,language:language as LanguageCode,requestId});
    return NextResponse.json(result,{status:result.status==="error"?503:200});
  } catch { return NextResponse.json({ requestId, status: "error", code: "INVALID_RESPONSE", message: "Unable to read this scan." }, { status: 400 }); }
}
