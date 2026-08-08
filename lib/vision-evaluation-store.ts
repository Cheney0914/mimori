"use client";
export type EvaluationVerdict = "pending" | "pass" | "fail";
export type VisionEvaluationRecord = { id: string; createdAt: string; testCase: string; expectedConcept: string; visionOutput: string; normalizedConcept: string; english: string; japanese: string; result: EvaluationVerdict; notes: string };
const key = "name-the-world:vision-evaluation-results:v1";
export const visionEvaluationStore = {
  read(): VisionEvaluationRecord[] { try { const value = window.localStorage.getItem(key); const records = value ? JSON.parse(value) : []; return Array.isArray(records) ? records : []; } catch { return []; } },
  write(records: VisionEvaluationRecord[]) { window.localStorage.setItem(key, JSON.stringify(records)); },
  add(record: VisionEvaluationRecord) { const records = [record, ...this.read()]; this.write(records); return records; },
  clear() { window.localStorage.removeItem(key); },
};
