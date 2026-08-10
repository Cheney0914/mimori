import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function loadRealAdapter() {
  const source = await readFile(new URL("../lib/real-vision-adapter.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  const require = (id) => {
    if (id === "@/lib/recognition") return { normalizeConcept: (raw) => raw === "mug" ? { id: "mug", defaultScene: "kitchen" } : undefined, candidateFor: (id, language, confidence) => ({ conceptId: id, canonicalName: id, confidence, sceneSuggestion: "kitchen", localized: { language, displayTerm: id } }) };
    if (id === "@/lib/scenes") return { isScene: (scene) => scene === "kitchen" };
    return {};
  };
  new Function("require", "module", "exports", output)(require, module, module.exports);
  return module.exports.RealVisionAdapter;
}

async function withVisionEnv(run, model = "gemini-2.0-flash") {
  const previous = { fetch: globalThis.fetch, key: process.env.VISION_API_KEY, model: process.env.VISION_MODEL, provider: process.env.VISION_PROVIDER, timeout: process.env.VISION_EVALUATION_PROVIDER_TIMEOUT_MS };
  process.env.VISION_API_KEY = "test-key-never-returned";
  process.env.VISION_MODEL = model;
  process.env.VISION_PROVIDER = "gemini";
  process.env.VISION_EVALUATION_PROVIDER_TIMEOUT_MS = "5";
  try { await run(); } finally { globalThis.fetch = previous.fetch; const names = { key: "VISION_API_KEY", model: "VISION_MODEL", provider: "VISION_PROVIDER", timeout: "VISION_EVALUATION_PROVIDER_TIMEOUT_MS" }; for (const [key, value] of Object.entries(previous)) { if (key !== "fetch") { const envKey = names[key]; if (value === undefined) delete process.env[envKey]; else process.env[envKey] = value; } } }
}

const visionInput = () => ({ image: new Blob(["test"], { type: "image/jpeg" }), language: "en", requestId: "test-request", evaluation: true });

test("recognition contracts keep candidate confirmation structured", async () => {
  const source = await readFile(new URL("../lib/recognition.ts", import.meta.url), "utf8");
  assert.match(source, /status:"needs_confirmation"/);
  assert.match(source, /candidates:/);
});

test("camera leaves every scan in a recoverable terminal state", async () => {
  const source = await readFile(new URL("../app/camera/page.tsx", import.meta.url), "utf8");
  assert.match(source, /AbortController/);
  assert.match(source, /setTimeout\(\(\) => aborter\.abort\(\), 9000\)/);
  assert.match(source, /setTimeout\(\(\) => .*setSlowNaming\(true\).*2000/);
  assert.match(source, /navigator\.onLine/);
  assert.match(source, /saving\.current/);
  assert.match(source, /setStatus\("result"\)/);
  assert.match(source, /setStatus\(parsed\.code === "TIMEOUT" \? "timeout" : "error"\)/);
  assert.match(source, /name === "AbortError" \? "timeout" : "error"/);
});

test("instant scan overlay is feature-flagged and releases the ephemeral frame", async () => {
  const source = await readFile(new URL("../app/camera/page.tsx", import.meta.url), "utf8");
  assert.match(source, /NEXT_PUBLIC_INSTANT_SCAN_OVERLAY/);
  assert.match(source, /URL\.createObjectURL/);
  assert.match(source, /URL\.revokeObjectURL/);
  assert.match(source, /CocoSsdLocalObjectDetector/);
  assert.match(source, /selectTargetDetection/);
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
  const source = await readFile(new URL("../components/vision-test-client.tsx", import.meta.url), "utf8");
  assert.match(source, /compressImage/);
  assert.match(source, /Raw provider response/);
  assert.match(source, /api\/recognize\?evaluation=1/);
});

test("vision evaluation raw output is gated outside production", async () => {
  const source = await readFile(new URL("../app/api/recognize/route.ts", import.meta.url), "utf8");
  assert.match(source, /VISION_PLAYGROUND_ENABLED/);
  assert.match(source, /VERCEL_ENV==="preview"/);
});

test("vision playground shows only safe recognition metadata", async () => {
  const route = await readFile(new URL("../app/api/recognize/route.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../components/vision-test-client.tsx", import.meta.url), "utf8");
  assert.match(route, /debug:\{recognitionMode,provider,model,requestId,providerDurationMs/);
  assert.match(page, /Request metadata/);
  assert.doesNotMatch(page, /VISION_API_KEY/);
});

test("vision latency adapter keeps evaluation timeout, one retry, and safe error classes", async () => {
  const source = await readFile(new URL("../lib/real-vision-adapter.ts", import.meta.url), "utf8");
  assert.match(source, /VISION_EVALUATION_PROVIDER_TIMEOUT_MS/);
  assert.match(source, /evaluation\?20000:8000/);
  assert.match(source, /attempt===1/);
  assert.match(source, /UPSTREAM_429/);
  assert.match(source, /UPSTREAM_5XX/);
  assert.match(source, /PROVIDER_TIMEOUT/);
  assert.match(source, /maxOutputTokens:128/);
});

test("vision playground uses a bounded sequential three-run mode", async () => {
  const source = await readFile(new URL("../components/vision-test-client.tsx", import.meta.url), "utf8");
  assert.match(source, /PLAYGROUND_TIMEOUT_MS = 25000/);
  assert.match(source, /index<\(repeat\?3:1\)/);
  assert.match(source, /Run same image 3 times/);
  assert.match(source, /CLIENT_TIMEOUT/);
});

test("vision playground model override is allowlisted and never used by Camera requests", async () => {
  const route = await readFile(new URL("../app/api/recognize/route.ts", import.meta.url), "utf8");
  const client = await readFile(new URL("../components/vision-test-client.tsx", import.meta.url), "utf8");
  const models = await readFile(new URL("../lib/vision-playground.ts", import.meta.url), "utf8");
  assert.match(models, /gemini-3\.6-flash/);
  assert.match(models, /gemini-3\.5-flash-lite/);
  assert.match(models, /gemini-3\.1-flash-lite/);
  assert.match(route, /isVisionPlaygroundModel\(requestedModel\)/);
  assert.match(route, /modelOverride:requestedModel\|\|undefined/);
  assert.match(client, /playgroundModel/);
  assert.match(client, /visionPlaygroundModels\.map/);
});

test("real adapter retries one provider timeout and reports it safely", async () => {
  await withVisionEnv(async () => {
    const RealVisionAdapter = await loadRealAdapter(); let calls = 0;
    globalThis.fetch = async (_url, init) => { calls += 1; return new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))); };
    const evaluation = await new RealVisionAdapter().recognizeForEvaluation(visionInput());
    assert.equal(calls, 2); assert.equal(evaluation.diagnostics.errorClass, "PROVIDER_TIMEOUT"); assert.equal(evaluation.diagnostics.retryCount, 1); assert.equal(evaluation.result.status, "error");
  });
});

test("real adapter retries 429 once and preserves a confirmed result", async () => {
  await withVisionEnv(async () => {
    const RealVisionAdapter = await loadRealAdapter(); let calls = 0;
    globalThis.fetch = async () => { calls += 1; return calls === 1 ? new Response(JSON.stringify({ error: { status: "RESOURCE_EXHAUSTED", message: "Too many requests" } }), { status: 429 }) : new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ candidates: [{ concept: "mug", confidence: .9, scene: "kitchen" }] }) }] } }] }), { status: 200 }); };
    const evaluation = await new RealVisionAdapter().recognizeForEvaluation(visionInput());
    assert.equal(calls, 2); assert.equal(evaluation.diagnostics.retryCount, 1); assert.equal(evaluation.result.status, "confirmed"); assert.equal(evaluation.result.primary.conceptId, "mug");
  });
});

test("gemini-3.6 request uses only the minimal supported config and redacted diagnostics", async () => {
  await withVisionEnv(async () => {
    const RealVisionAdapter = await loadRealAdapter(); let body;
    globalThis.fetch = async (_url, init) => { body = JSON.parse(init.body); return new Response(JSON.stringify({ usageMetadata: { promptTokenCount: 41, candidatesTokenCount: 12, totalTokenCount: 53 }, candidates: [{ content: { parts: [{ text: JSON.stringify({ candidates: [{ concept: "mug", confidence: .9, scene: "kitchen" }] }) }] } }] }), { status: 200 }); };
    const evaluation = await new RealVisionAdapter().recognizeForEvaluation(visionInput());
    assert.equal(evaluation.result.status, "confirmed"); assert.deepEqual(body.generationConfig, { responseMimeType: "application/json", maxOutputTokens: 128, thinkingConfig: { thinkingLevel: "minimal" } }); assert.equal("temperature" in body.generationConfig, false); assert.equal("thinkingBudget" in body.generationConfig.thinkingConfig, false); assert.equal(evaluation.diagnostics.outgoingRequestConfig.generationConfig.thinkingConfig.thinkingLevel, "minimal"); assert.equal(evaluation.diagnostics.promptTokenCount, 41); assert.equal(evaluation.diagnostics.outputTokenCount, 12); assert.equal(evaluation.diagnostics.totalTokenCount, 53); assert.doesNotMatch(JSON.stringify(evaluation.diagnostics.outgoingRequestConfig), /test-key-never-returned/);
  }, "gemini-3.6-flash");
});

test("real adapter treats INVALID_ARGUMENT 400 as non-retryable", async () => {
  await withVisionEnv(async () => {
    const RealVisionAdapter = await loadRealAdapter(); let calls = 0;
    globalThis.fetch = async () => { calls += 1; return new Response(JSON.stringify({ error: { status: "INVALID_ARGUMENT", message: "Bad request" } }), { status: 400 }); };
    const evaluation = await new RealVisionAdapter().recognizeForEvaluation(visionInput());
    assert.equal(calls, 1); assert.equal(evaluation.diagnostics.retryCount, 0); assert.equal(evaluation.diagnostics.errorClass, "UPSTREAM_4XX");
  });
});

test("mobile sheets keep a fixed horizontal anchor and shared dismissal wiring", async () => {
  const overlay = await readFile(new URL("../components/mobile-overlay.tsx", import.meta.url), "utf8");
  const wordDetail = await readFile(new URL("../components/word-detail-sheet.tsx", import.meta.url), "utf8");
  const scanResult = await readFile(new URL("../components/scan-result-sheet.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/wiring.css", import.meta.url), "utf8");
  assert.match(overlay, /offset > 100 \|\| velocity > \.65/);
  assert.match(overlay, /event\.key === "Escape"/);
  assert.match(wordDetail, /label="Word detail" onDismiss=\{onClose\}/);
  assert.match(scanResult, /label="Recognition result" onDismiss=\{onClose\}/);
  assert.match(css, /translateX\(-50%\) translateY\(var\(--sheet-drag-y,0\)\)/);
  assert.match(css, /@keyframes mobileSheetEnter/);
});
