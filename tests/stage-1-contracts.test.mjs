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
  assert.match(source, /normalizeConcept/);
  assert.match(source, /response_format/);
  assert.match(source, /NO_CLEAR_OBJECT/);
});

test("recognition service keeps mock and real selection behind the API", async () => {
  const source = await readFile(new URL("../lib/recognition-service.ts", import.meta.url), "utf8");
  assert.match(source, /MockVisionAdapter/);
  assert.match(source, /RealVisionAdapter/);
  assert.match(source, /RECOGNITION_MODE/);
});
