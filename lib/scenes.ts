import { SceneCategory } from "@/lib/types";
export const sceneConfig: Record<SceneCategory, { name: string; className: string }> = {
  kitchen: { name: "Kitchen", className: "kitchen" }, food_drink: { name: "Food & Drink", className: "food" }, home: { name: "Home", className: "home" }, bathroom: { name: "Bathroom", className: "bathroom" },
  work_study: { name: "Work & Study", className: "work" }, clothing_personal: { name: "Clothing & Personal", className: "clothing" }, outside: { name: "Outside", className: "outside" }, other: { name: "Other", className: "other" },
};
export const sceneIds = Object.keys(sceneConfig) as SceneCategory[];
export const isScene = (value: string): value is SceneCategory => value in sceneConfig;
