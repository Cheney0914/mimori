"use client";

import { CSSProperties, PointerEvent, ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type MobileOverlayProps = { children: ReactNode };
type MobileBottomSheetProps = MobileOverlayProps & { label: string; className?: string; onDismiss?: () => void };

export function MobileOverlay({ children }: MobileOverlayProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  useEffect(() => { setPortalRoot(document.body); }, []);
  if (!portalRoot) return null;
  return createPortal(<div className="mobileOverlay">{children}</div>, portalRoot);
}

export function MobileBottomSheet({ children, label, className = "", onDismiss }: MobileBottomSheetProps) {
  const startY = useRef(0), startTime = useRef(0);
  const [dragY, setDragY] = useState(0), [dragging, setDragging] = useState(false);
  useEffect(() => { if (!onDismiss) return; const dismissOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onDismiss(); }; window.addEventListener("keydown", dismissOnEscape); return () => window.removeEventListener("keydown", dismissOnEscape); }, [onDismiss]);
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => { if (!onDismiss) return; startY.current = event.clientY; startTime.current = performance.now(); setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); };
  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => { if (dragging) setDragY(Math.max(0, event.clientY - startY.current)); };
  const onPointerEnd = (event: PointerEvent<HTMLButtonElement>) => { if (!dragging) return; const offset = Math.max(0, event.clientY - startY.current), velocity = offset / Math.max(performance.now() - startTime.current, 1); setDragging(false); setDragY(0); if (offset > 100 || velocity > .65) onDismiss?.(); };
  const style = { "--sheet-drag-y": `${dragY}px` } as CSSProperties;
  return <MobileOverlay><section className={`mobileBottomSheet ${dragging ? "dragging" : ""} ${className}`} style={style} role="dialog" aria-modal="true" aria-label={label}>{onDismiss && <button className="sheetDragHandle" aria-label="Dismiss sheet" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}><span /></button>}{children}</section></MobileOverlay>;
}
