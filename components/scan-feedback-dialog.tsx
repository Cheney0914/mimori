import { ReactNode } from "react";
import { MobileOverlay } from "@/components/mobile-overlay";

type ScanFeedbackDialogProps = {
  title: string;
  children: ReactNode;
};

export function ScanFeedbackDialog({ title, children }: ScanFeedbackDialogProps) {
  return <MobileOverlay><div className="scanDialogOverlay"><section className="scanDialog" role="dialog" aria-modal="true" aria-label={title}>{children}</section></div></MobileOverlay>;
}
