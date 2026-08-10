"use client";
import { ScanFeedbackDialog } from "@/components/scan-feedback-dialog";
import { RecognitionCandidate } from "@/lib/types";

export function CandidateConfirmationSheet({ candidates, onSelect, onDismiss }: { candidates: RecognitionCandidate[]; onSelect: (candidate: RecognitionCandidate) => void; onDismiss: () => void }) {
  return <ScanFeedbackDialog title="Which one is closer?"><p className="micro">Recognition needs a closer look</p><h2>Which one is closer?</h2><div className="candidates">{candidates.slice(0, 3).map(candidate => { const term = candidate.localized; return <button key={candidate.conceptId} className="candidate" onClick={() => onSelect(candidate)}><b>{term.displayTerm}</b><span>{term.pronunciation || term.romaji || term.kana || ""}</span>{term.broaderTerm && <small>broader: {term.broaderTerm}</small>}</button>; })}</div><button className="textbutton" onClick={onDismiss}>None of these</button><button className="cta" onClick={onDismiss}>Scan again</button></ScanFeedbackDialog>;
}
