"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type HorizontalScrollerProps = {
  heading: ReactNode;
  label: string;
  perView?: 1 | 2 | 3;
  children: ReactNode;
};

type Edges = { scrollable: boolean; atStart: boolean; atEnd: boolean };

export function HorizontalScroller({ heading, label, perView = 3, children }: HorizontalScrollerProps) {
  const trackRef = useRef<HTMLUListElement | null>(null);
  const [edges, setEdges] = useState<Edges>({ scrollable: false, atStart: true, atEnd: false });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function update() {
      if (!track) return;
      const max = track.scrollWidth - track.clientWidth;
      setEdges({
        scrollable: max > 2,
        atStart: track.scrollLeft <= 2,
        atEnd: track.scrollLeft >= max - 2,
      });
    }

    update();
    track.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  function scrollByPage(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const item = track.querySelector<HTMLElement>(":scope > li");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = item ? item.offsetWidth + gap : track.clientWidth;
    // Move by whole cards so snapping lands cleanly.
    const cards = Math.max(1, Math.floor((track.clientWidth + gap) / step));
    track.scrollBy({ left: direction * cards * step, behavior: "smooth" });
  }

  return (
    <>
      <div className="h-scroller-header">
        {heading}
        {edges.scrollable ? (
          <div className="h-scroller-controls">
            <button
              type="button"
              className="h-scroller-button"
              aria-label={`Previous ${label}`}
              disabled={edges.atStart}
              onClick={() => scrollByPage(-1)}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="h-scroller-button"
              aria-label={`Next ${label}`}
              disabled={edges.atEnd}
              onClick={() => scrollByPage(1)}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
      <div
        className={`h-scroller${edges.scrollable ? " is-scrollable" : ""}${
          edges.atStart ? " at-start" : ""
        }${edges.atEnd ? " at-end" : ""}`}
        style={{ "--per-view-max": perView } as CSSProperties}
      >
        <ul className="h-scroller-track" ref={trackRef} aria-label={label} tabIndex={0}>
          {children}
        </ul>
      </div>
    </>
  );
}
