import { VisionTestClient } from "@/components/vision-test-client";
import { isVisionPlaygroundModel } from "@/lib/vision-playground";

export default function VisionTestPage() {
  const configuredModel = process.env.VISION_MODEL;
  const defaultModel = isVisionPlaygroundModel(configuredModel) ? configuredModel : "gemini-3.6-flash";
  return <VisionTestClient defaultModel={defaultModel} />;
}
