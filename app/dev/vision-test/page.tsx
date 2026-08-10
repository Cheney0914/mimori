import { VisionTestClient } from "@/components/vision-test-client";
import { isVisionPlaygroundModel } from "@/lib/vision-playground";
import { DEFAULT_VISION_MODEL } from "@/lib/vision-model";

export default function VisionTestPage() {
  const configuredModel = process.env.VISION_MODEL;
  const defaultModel = isVisionPlaygroundModel(configuredModel) ? configuredModel : DEFAULT_VISION_MODEL;
  return <VisionTestClient defaultModel={defaultModel} />;
}
