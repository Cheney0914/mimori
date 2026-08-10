"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TopBar } from "@/components/top-bar";
import { ScanResultSheet } from "@/components/scan-result-sheet";
import { CandidateConfirmationSheet } from "@/components/candidate-confirmation-sheet";
import { ScanFeedbackDialog } from "@/components/scan-feedback-dialog";
import { preferencesRepository, userConceptRepository } from "@/lib/db";
import { captureFrame } from "@/lib/frame-processor";
import { CocoSsdLocalObjectDetector, LocalDetection, selectTargetDetection } from "@/lib/local-object-detector";
import { parseRecognition } from "@/lib/recognition";
import { EncounterTransaction, LanguageCode, RecognitionCandidate } from "@/lib/types";

type Status = "ready" | "recognizing" | "permission_denied" | "offline" | "timeout" | "error" | "candidates" | "result";
type OverlayTarget = { detection?: LocalDetection; sourceWidth: number; sourceHeight: number; viewportWidth: number; viewportHeight: number };
const instantOverlayEnabled = process.env.NEXT_PUBLIC_INSTANT_SCAN_OVERLAY === "true";
const prompts: Record<LanguageCode, string[]> = {
  en: ["Scan something you use every day but have never named in English.", "Find something you recognise but cannot immediately name.", "Choose something you usually call “that thing.”"],
  ja: ["Scan one thing you would like to hear in Japanese.", "Start with the object closest to you.", "You do not need to remember it yet. Just hear its name."],
};

function overlayStyle(target: OverlayTarget): CSSProperties {
  if (!target.detection) return {};
  const { bbox } = target.detection;
  const scale = Math.max(target.viewportWidth / target.sourceWidth, target.viewportHeight / target.sourceHeight);
  const renderedWidth = target.sourceWidth * scale;
  const renderedHeight = target.sourceHeight * scale;
  const left = (target.viewportWidth - renderedWidth) / 2 + bbox.x * scale;
  const top = (target.viewportHeight - renderedHeight) / 2 + bbox.y * scale;
  return { left: `${(left / target.viewportWidth) * 100}%`, top: `${(top / target.viewportHeight) * 100}%`, width: `${(bbox.width * scale / target.viewportWidth) * 100}%`, height: `${(bbox.height * scale / target.viewportHeight) * 100}%` };
}

export default function Camera() {
  const video = useRef<HTMLVideoElement>(null);
  const camera = useRef<HTMLDivElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const controller = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detector = useRef<CocoSsdLocalObjectDetector | undefined>(undefined);
  const detectorReady = useRef(false);
  const frozenUrl = useRef<string | undefined>(undefined);
  const request = useRef(0);
  const undone = useRef(false);
  const saving = useRef(false);
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [status, setStatus] = useState<Status>("ready");
  const [prompt, setPrompt] = useState(0);
  const [candidate, setCandidate] = useState<RecognitionCandidate>();
  const [candidates, setCandidates] = useState<RecognitionCandidate[]>([]);
  const [transaction, setTransaction] = useState<EncounterTransaction>();
  const [frameUrl, setFrameUrl] = useState<string>();
  const [target, setTarget] = useState<OverlayTarget>();
  const [slowNaming, setSlowNaming] = useState(false);

  const releaseFrame = () => {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    releaseTimer.current = null;
    if (frozenUrl.current) URL.revokeObjectURL(frozenUrl.current);
    frozenUrl.current = undefined;
    setFrameUrl(undefined);
    setTarget(undefined);
  };
  const cancelRecognition = () => {
    controller.current?.abort();
    controller.current = null;
    if (timer.current) clearTimeout(timer.current);
    if (slowTimer.current) clearTimeout(slowTimer.current);
    timer.current = null;
    slowTimer.current = null;
    setSlowNaming(false);
  };
  const reset = () => {
    request.current += 1;
    cancelRecognition();
    releaseFrame();
    setCandidate(undefined);
    setCandidates([]);
    setTransaction(undefined);
    undone.current = false;
    setStatus("ready");
  };

  useEffect(() => {
    preferencesRepository.get().then(p => p.language && setLanguage(p.language));
    return () => { request.current += 1; cancelRecognition(); releaseFrame(); stream.current?.getTracks().forEach(track => track.stop()); };
  }, []);
  useEffect(() => { preferencesRepository.save({ onboardingComplete: true, language }); }, [language]);

  async function prepareDetector() {
    if (!instantOverlayEnabled || detectorReady.current) return;
    detectorReady.current = true;
    const startedAt = performance.now();
    try {
      detector.current ??= new CocoSsdLocalObjectDetector();
      await detector.current.warm();
      console.info("instant_scan_detector_loaded", { loadDurationMs: Math.round(performance.now() - startedAt) });
    } catch {
      detector.current = undefined;
      console.info("instant_scan_detector_unavailable", { loadDurationMs: Math.round(performance.now() - startedAt) });
    }
  }
  async function openCamera() {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      stream.current?.getTracks().forEach(track => track.stop());
      stream.current = media;
      if (video.current) video.current.srcObject = media;
      setStatus("ready");
    } catch { setStatus("permission_denied"); }
  }
  useEffect(() => { void openCamera(); }, []);

  async function save(candidateToSave: RecognitionCandidate) {
    if (saving.current) return;
    saving.current = true;
    try {
      const next = await userConceptRepository.record(candidateToSave.conceptId, language, candidateToSave.sceneSuggestion, candidateToSave.localized);
      setCandidate(candidateToSave);
      setTransaction(next);
      undone.current = false;
      setStatus("result");
    } finally { saving.current = false; }
  }
  function deferRelease() {
    if (!instantOverlayEnabled) return;
    releaseTimer.current = setTimeout(releaseFrame, 1400);
  }
  async function locateTarget(id: number, canvas: HTMLCanvasElement, targetBase: OverlayTarget) {
    if (!detector.current) return;
    const startedAt = performance.now();
    try {
      const selected = selectTargetDetection(await detector.current.detect(canvas), targetBase.sourceWidth, targetBase.sourceHeight);
      if (id === request.current && selected) setTarget({ ...targetBase, detection: selected });
      console.info("instant_scan_detection", { durationMs: Math.round(performance.now() - startedAt), foundTarget: Boolean(selected) });
    } catch { console.info("instant_scan_detection_failed", { durationMs: Math.round(performance.now() - startedAt) }); }
    finally { canvas.width = 0; canvas.height = 0; }
  }
  async function scan() {
    if (status !== "ready" || !video.current) return;
    if (!navigator.onLine) { setStatus("offline"); return; }
    const id = ++request.current;
    const startedAt = performance.now();
    setStatus("recognizing");
    setSlowNaming(false);
    try {
      const frame = await captureFrame(video.current);
      const viewport = camera.current?.getBoundingClientRect();
      const targetBase = { sourceWidth: frame.width, sourceHeight: frame.height, viewportWidth: viewport?.width || frame.width, viewportHeight: viewport?.height || frame.height };
      if (instantOverlayEnabled) {
        const url = URL.createObjectURL(frame.blob);
        frozenUrl.current = url;
        setFrameUrl(url);
        setTarget(targetBase);
        void locateTarget(id, frame.canvas, targetBase);
      } else { frame.canvas.width = 0; frame.canvas.height = 0; }
      const aborter = new AbortController();
      controller.current = aborter;
      slowTimer.current = setTimeout(() => { if (id === request.current) setSlowNaming(true); }, 2000);
      timer.current = setTimeout(() => aborter.abort(), 9000);
      const form = new FormData();
      form.append("image", frame.blob, "frame.jpg");
      form.append("language", language);
      form.append("clientRequestId", crypto.randomUUID());
      const response = await fetch("/api/recognize", { method: "POST", body: form, signal: aborter.signal });
      const parsed = parseRecognition(await response.json());
      if (id !== request.current) return;
      if (!parsed) throw new Error("Invalid response");
      if (parsed.status === "confirmed") {
        setCandidate(parsed.primary); // The target label changes before the local encounter write completes.
        await save(parsed.primary);
        console.info("instant_scan_result", { totalDurationMs: Math.round(performance.now() - startedAt), outcome: "confirmed" });
        return;
      }
      if (parsed.status === "needs_confirmation") {
        setCandidates(parsed.candidates.slice(0, 3));
        setStatus("candidates");
        return;
      }
      setStatus(parsed.code === "TIMEOUT" ? "timeout" : "error");
      deferRelease();
    } catch (error) {
      if (id !== request.current) return;
      setStatus((error as Error).name === "AbortError" ? "timeout" : "error");
      deferRelease();
    } finally {
      if (timer.current) clearTimeout(timer.current);
      if (slowTimer.current) clearTimeout(slowTimer.current);
      timer.current = null;
      slowTimer.current = null;
      controller.current = null;
      setSlowNaming(false);
    }
  }
  async function wrongObject() {
    if (!transaction || undone.current) return;
    undone.current = true;
    const undoneTransaction = await userConceptRepository.undo(transaction);
    setTransaction(undoneTransaction);
    setCandidate(undefined);
    if (candidates.length) setStatus("candidates"); else setStatus("error");
  }
  const changeLanguage = (next: LanguageCode) => { if (status === "ready") { setLanguage(next); setPrompt(0); } };
  const overlayLabel = candidate ? candidate.localized.displayTerm : slowNaming ? "Still naming…" : "NAMING…";

  return <AppShell><TopBar language={language} onLanguageChange={changeLanguage} /><p className="micro prompt">{prompts[language][prompt]}</p><button className="another" disabled={status !== "ready"} onClick={() => setPrompt((prompt + 1) % prompts[language].length)}>another prompt</button><div className="camera" ref={camera}>{status === "permission_denied" ? <div className="cameraMessage">Camera access is needed to name objects around you.<button className="outline" onClick={openCamera}>Try camera again</button></div> : <>{frameUrl ? <img className="frozenFrame" src={frameUrl} alt="Frozen camera frame while naming an object" /> : <video ref={video} autoPlay playsInline muted onCanPlay={() => void prepareDetector()} />}{instantOverlayEnabled && target && <div className={`targetOverlay ${target.detection ? "detected" : "fallback"}`} style={overlayStyle(target)}><span className="targetLabel">{overlayLabel}{candidate && (candidate.localized.pronunciation || candidate.localized.romaji || candidate.localized.kana) && <small>{candidate.localized.pronunciation || candidate.localized.romaji || candidate.localized.kana}</small>}</span></div>}<div className="frame" /><span className="ready">{status === "recognizing" ? (slowNaming ? "STILL NAMING…" : "NAMING…") : "OBJECT READY"}</span></>}</div><div className="scanrow"><button onClick={scan} disabled={status !== "ready"} className="scan" aria-label="Scan object">{status === "recognizing" ? "…" : "SCAN"}</button></div>{status === "offline" && <ScanFeedbackDialog title="You’re offline"><h2>You’re offline.</h2><p className="copy">Your world is still here, but naming a new object needs a connection.</p><button className="cta" onClick={reset}>Back to camera</button></ScanFeedbackDialog>}{status === "timeout" && <ScanFeedbackDialog title="Still no name yet."><h2>Still no name yet.</h2><p className="copy">The recognition took too long. Try scanning again.</p><button className="cta" onClick={reset}>Try again</button><button className="textbutton" onClick={reset}>Back to camera</button></ScanFeedbackDialog>}{status === "error" && !transaction && <ScanFeedbackDialog title="Couldn’t name this one."><h2>Couldn’t name this one.</h2><p className="copy">Try moving closer or keeping one object in the centre.</p><button className="cta" onClick={reset}>Scan again</button><button className="textbutton" onClick={reset}>Back to camera</button></ScanFeedbackDialog>}{status === "error" && transaction && <ScanFeedbackDialog title="This encounter was removed."><h2>This encounter was removed.</h2><button className="cta" onClick={reset}>Scan again</button><button className="textbutton" onClick={reset}>Back to camera</button></ScanFeedbackDialog>} {status === "candidates" && <CandidateConfirmationSheet candidates={candidates} onSelect={candidateToSave => { void save(candidateToSave); }} onDismiss={reset} />}{status === "result" && candidate && transaction && <ScanResultSheet candidate={candidate} transaction={transaction} onWrong={() => { void wrongObject(); }} onClose={reset} />}</AppShell>;
}
