import { ReactNode } from "react";

type ScanFeedbackDialogProps = {
  title: string;
  children: ReactNode;
};

export function ScanFeedbackDialog({ title, children }: ScanFeedbackDialogProps) {
  return <div className="scanDialogOverlay"><section className="scanDialog" role="dialog" aria-modal="true" aria-label={title}>{children}</section></div>;
}
