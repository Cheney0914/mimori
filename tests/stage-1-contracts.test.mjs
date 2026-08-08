import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("recognition contracts keep candidate confirmation structured", async () => {
  const source = await readFile(new URL("../lib/recognition.ts", import.meta.url), "utf8");
  assert.match(source, /status:"needs_confirmation"/);
  assert.match(source, /candidates:/);
});

test("camera keeps timeout, offline, and duplicate-save guards", async () => {
  const source = await readFile(new URL("../app/camera/page.tsx", import.meta.url), "utf8");
  assert.match(source, /AbortController/);
  assert.match(source, /10000/);
  assert.match(source, /navigator\.onLine/);
  assert.match(source, /saving\.current/);
});

test("database v2 has language-scene association storage", async () => {
  const source = await readFile(new URL("../lib/db.ts", import.meta.url), "utf8");
  assert.match(source, /VERSION = 2/);
  assert.match(source, /conceptScenes/);
  assert.match(source, /encounterCount/);
});

test("real adapter stays server-side and normalizes provider concepts", async () => {
  const source = await readFile(new URL("../lib/real-vision-adapter.ts", import.meta.url), "utf8");
  assert.match(source, /VISION_API_KEY/);
  assert.match(source, /VISION_PROVIDER/);
  assert.match(source, /gemini/);
  assert.match(source, /normalizeConcept/);
  assert.match(source, /NO_CLEAR_OBJECT/);
});

test("recognition service keeps mock and real selection behind the API", async () => {
  const source = await readFile(new URL("../lib/recognition-service.ts", import.meta.url), "utf8");
  assert.match(source, /MockVisionAdapter/);
  assert.match(source, /RealVisionAdapter/);
  assert.match(source, /RECOGNITION_MODE/);
});

test("vision evaluator remains temporary and does not write to the user world", async () => {
  const source = await readFile(new URL("../app/dev/vision-test/page.tsx", import.meta.url), "utf8");
  assert.match(source, /compressImage/);
  assert.match(source, /Raw provider response/);
  assert.match(source, /api\/recognize\?evaluation=1/);
});

test("vision evaluation raw output is gated outside production", async () => {
  const source = await readFile(new URL("../app/api/recognize/route.ts", import.meta.url), "utf8");
  assert.match(source, /VISION_PLAYGROUND_ENABLED/);
  assert.match(source, /VERCEL_ENV==="preview"/);
});
