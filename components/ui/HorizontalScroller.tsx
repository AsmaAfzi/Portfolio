"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type HorizontalScrollerProps = {
  heading: ReactNode;
  label: string;
  perView?: 1 | 2 | 3;
  /** Advance one card every this many ms. */
  autoPlay?: number;
  /** Wrap around so the first card follows the last. */
  loop?: boolean;
  children: ReactNode;
};

type Edges = { scrollable: boolean; atStart: boolean; atEnd: boolean };

// Long enough that sweeping the pointer across the row doesn't flash panels open.
const HOVER_OPEN_DELAY = 180;
// Must match the .project-details transform transitions so the pushed cards
// stay level with the panel's edge. The easing is the site's --ease-out.
const PUSH_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const OPEN_TIMING = { duration: 600, delay: 0 };
const CLOSE_TIMING = { duration: 450, delay: 80 };

function slotOf(target: EventTarget | null) {
  return target instanceof Element ? target.closest<HTMLElement>("[data-expandable]") : null;
}

function setExpanded(slot: HTMLElement, open: boolean) {
  slot.classList.toggle("is-open", open);
  if (!open) delete slot.dataset.pinned;
  slot.querySelector("[data-details-toggle]")?.setAttribute("aria-expanded", String(open));
}

function rowGap(track: HTMLElement) {
  return parseFloat(getComputedStyle(track).columnGap) || 0;
}

// One closed card plus the gap (an open card spans two columns).
function cardStep(track: HTMLElement) {
  const item = track.querySelector<HTMLElement>(":scope > li:not(:has(.is-open))");
  return item ? item.offsetWidth + rowGap(track) : track.clientWidth;
}

function visibleCards(track: HTMLElement) {
  return Math.max(1, Math.floor((track.clientWidth + rowGap(track)) / cardStep(track)));
}

// Scrolls by whole cards. With `rotation`, the row wraps around: cards that
// scrolled out on one side are moved to the other with CSS `order` (leaving
// React's DOM alone) while the scroll position shifts by the same amount, so
// nothing visibly jumps and the first card follows the last.
function scrollCards(track: HTMLElement, cards: number, rotation?: { current: number }) {
  const step = cardStep(track);
  const max = track.scrollWidth - track.clientWidth;
  if (rotation && max > 2) {
    const items = Array.from(track.children) as HTMLElement[];
    // Never rotate a card that's on screen.
    const count = Math.sign(cards) * Math.min(Math.abs(cards), items.length - visibleCards(track));
    const room = Math.round((count > 0 ? max - track.scrollLeft : track.scrollLeft) / step);
    const shift = Math.sign(count) * Math.max(0, Math.abs(count) - room);
    if (shift !== 0) {
      rotation.current += shift;
      const n = items.length;
      items.forEach((item, index) => {
        item.style.order = String((((index - rotation.current) % n) + n) % n);
      });
      track.scrollTo({ left: track.scrollLeft - shift * step, behavior: "instant" });
    }
    cards = count;
  }
  track.scrollBy({ left: cards * step, behavior: "smooth" });
}

// One column plus the gap: how far an opening panel pushes its neighbours.
function columnStep(track: HTMLElement, slot: HTMLElement) {
  return slot.getBoundingClientRect().width + rowGap(track);
}

// Opening a panel makes its card take two columns. It opens to the right when
// that fits in the visible row, pushing later cards along; otherwise to the
// left, pushing earlier ones back. If neither fits it covers the card.
function placePanel(track: HTMLElement, slot: HTMLElement) {
  const row = track.getBoundingClientRect();
  const card = slot.getBoundingClientRect();
  const step = columnStep(track, slot);
  slot.dataset.side =
    card.right + step <= row.right + 1 ? "right" : card.left - step >= row.left - 1 ? "left" : "over";
}

// Layout changes instantly; each card then glides from where it was on screen
// to its new place. Starting from the on-screen position keeps it smooth when
// another change interrupts a glide that's still running.
function animateRelayout(track: HTMLElement, change: () => void, timing: typeof OPEN_TIMING) {
  const items = Array.from(track.children) as HTMLElement[];
  const before = items.map((item) => item.getBoundingClientRect().left);
  for (const item of items) for (const animation of item.getAnimations()) animation.cancel();
  change();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  items.forEach((item, index) => {
    const dx = before[index] - item.getBoundingClientRect().left;
    if (Math.abs(dx) < 0.5) return;
    item.animate([{ transform: `translateX(${dx}px)` }, { transform: "none" }], {
      ...timing,
      easing: PUSH_EASING,
      fill: "backwards",
    });
  });
}

export function HorizontalScroller({
  heading,
  label,
  perView = 3,
  autoPlay,
  loop = false,
  children,
}: HorizontalScrollerProps) {
  const rotationRef = useRef(0);
  const trackRef = useRef<HTMLUListElement | null>(null);
  const [edges, setEdges] = useState<Edges>({ scrollable: false, atStart: true, atEnd: false });
  const updateEdgesRef = useRef<() => void>(() => {});

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
    updateEdgesRef.current = update;
    track.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let timer = 0;

    const openSlots = () => Array.from(track.querySelectorAll<HTMLElement>("[data-expandable].is-open"));

    // A left-opening card grows its column rightwards in the layout, so the
    // row scrolls by the same step to keep the card still on screen; the
    // earlier cards then appear pushed left. Closing undoes it.
    function collapse(slots: HTMLElement[]) {
      if (!track) return 0;
      let scroll = track.scrollLeft;
      for (const slot of slots) {
        if (slot.dataset.side === "left") scroll -= columnStep(track, slot);
        setExpanded(slot, false);
      }
      return Math.max(0, scroll);
    }

    function close(slots: HTMLElement[]) {
      if (!track || slots.length === 0) return;
      animateRelayout(
        track,
        () => track.scrollTo({ left: collapse(slots), behavior: "instant" }),
        CLOSE_TIMING,
      );
      updateEdgesRef.current();
    }

    function open(slot: HTMLElement, pinned: boolean) {
      if (!track) return;
      const others = openSlots().filter((other) => other !== slot);
      // The card being opened stays where it is on screen (under the pointer);
      // the row scrolls around it as other panels close and this one opens.
      const anchor = slot.getBoundingClientRect().left;
      const keepAnchored = () =>
        track.scrollTo({
          left: track.scrollLeft + slot.getBoundingClientRect().left - anchor,
          behavior: "instant",
        });
      animateRelayout(
        track,
        () => {
          collapse(others);
          keepAnchored();
          placePanel(track, slot);
          setExpanded(slot, true);
          keepAnchored();
        },
        OPEN_TIMING,
      );
      if (pinned) slot.dataset.pinned = "true";
      updateEdgesRef.current();
    }

    // Moving between cards switches panels after a short rest; a panel only
    // closes once the pointer leaves the row. Closing on leaving the card would
    // slide the next card out from under the pointer.
    function onPointerOver(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      window.clearTimeout(timer);
      const slot = slotOf(event.target);
      if (slot && !slot.classList.contains("is-open")) {
        timer = window.setTimeout(() => open(slot, false), HOVER_OPEN_DELAY);
      }
    }

    function onPointerOut(event: PointerEvent) {
      if (event.pointerType !== "mouse" || track?.contains(event.relatedTarget as Node | null)) return;
      window.clearTimeout(timer);
      close(openSlots().filter((slot) => !slot.dataset.pinned));
    }

    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      const slot = slotOf(target);
      if (!slot) return;
      if (target?.closest("[data-details-close]")) {
        close([slot]);
        slot.querySelector<HTMLElement>("[data-details-toggle]")?.focus();
      } else if (target?.closest("[data-details-toggle]")) {
        window.clearTimeout(timer);
        // A hover-opened panel gets pinned by the click rather than closed.
        if (slot.dataset.pinned) close([slot]);
        else if (slot.classList.contains("is-open")) slot.dataset.pinned = "true";
        else open(slot, true);
      }
    }

    function onDocumentClick(event: MouseEvent) {
      close(openSlots().filter((slot) => !slot.contains(event.target as Node | null)));
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const slots = openSlots();
      const focused = slots.find((slot) => slot.contains(document.activeElement));
      close(slots);
      focused?.querySelector<HTMLElement>("[data-details-toggle]")?.focus();
    }

    track.addEventListener("pointerover", onPointerOver);
    track.addEventListener("pointerout", onPointerOut);
    track.addEventListener("click", onClick);
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      track.removeEventListener("pointerover", onPointerOver);
      track.removeEventListener("pointerout", onPointerOut);
      track.removeEventListener("click", onClick);
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Autoplay waits while the visitor is engaged with the section (pointer over
  // it, focus inside, a case study open) or can't see it. Any scroll, the
  // visitor's own included, restarts the wait.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !autoPlay) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const area = track.closest("section") ?? track.parentElement ?? track;
    let hovering = false;
    let visible = false;
    let timer = 0;

    const paused = () =>
      hovering ||
      !visible ||
      document.hidden ||
      area.contains(document.activeElement) ||
      track.querySelector(".is-open") !== null;

    function restart() {
      window.clearTimeout(timer);
      timer = window.setTimeout(advance, autoPlay);
    }

    function advance() {
      if (!track) return;
      if (!paused()) {
        const max = track.scrollWidth - track.clientWidth;
        if (loop) scrollCards(track, 1, rotationRef);
        else if (track.scrollLeft >= max - 2) track.scrollTo({ left: 0, behavior: "smooth" });
        else scrollCards(track, 1);
      }
      restart();
    }

    const onEnter = () => {
      hovering = true;
    };
    const onLeave = () => {
      hovering = false;
      restart();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) restart();
    });

    observer.observe(track);
    area.addEventListener("pointerenter", onEnter);
    area.addEventListener("pointerleave", onLeave);
    track.addEventListener("scrollend", restart);
    restart();
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      area.removeEventListener("pointerenter", onEnter);
      area.removeEventListener("pointerleave", onLeave);
      track.removeEventListener("scrollend", restart);
    };
  }, [autoPlay, loop]);

  function scrollByPage(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    scrollCards(track, direction * visibleCards(track), loop ? rotationRef : undefined);
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
              disabled={!loop && edges.atStart}
              onClick={() => scrollByPage(-1)}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="h-scroller-button"
              aria-label={`Next ${label}`}
              disabled={!loop && edges.atEnd}
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
