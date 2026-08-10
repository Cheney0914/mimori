"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type MobileOverlayProps = { children: ReactNode };
type MobileBottomSheetProps = MobileOverlayProps & { label: string; className?: string };

export function MobileOverlay({ children }: MobileOverlayProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  useEffect(() => { setPortalRoot(document.body); }, []);
  if (!portalRoot) return null;
  return createPortal(<div className="mobileOverlay">{children}</div>, portalRoot);
}

export function MobileBottomSheet({ children, label, className = "" }: MobileBottomSheetProps) {
  return <MobileOverlay><section className={`mobileBottomSheet ${className}`} role="dialog" aria-modal="true" aria-label={label}>{children}</section></MobileOverlay>;
}
