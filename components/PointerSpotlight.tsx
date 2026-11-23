"use client";

import { useEffect } from "react";

export function PointerSpotlight() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    let latest: PointerEvent | null = null;

    const update = () => {
      frame = 0;
      const target = latest?.target;
      if (!latest || !(target instanceof Element)) return;
      const card = target.closest<HTMLElement>(".ui-card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${latest.clientX - rect.left}px`);
      card.style.setProperty("--my", `${latest.clientY - rect.top}px`);
    };

    const onMove = (event: PointerEvent) => {
      latest = event;
      if (!frame) frame = requestAnimationFrame(update);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
