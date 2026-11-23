"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { hsvToHex, type Hsv } from "@/lib/color";

type ColorWheelProps = {
  value: Hsv;
  onChange: (value: Hsv) => void;
};

export function ColorWheel({ value, onChange }: ColorWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);

  function pickAt(clientX: number, clientY: number) {
    const wheel = wheelRef.current;
    if (!wheel) return;
    const rect = wheel.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const h = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    const s = Math.min(1, Math.hypot(dx, dy) / (rect.width / 2));
    // Picking on the wheel while the color is near-black would show no change.
    onChange({ h, s, v: value.v < 0.1 ? 0.85 : value.v });
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pickAt(event.clientX, event.clientY);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      pickAt(event.clientX, event.clientY);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 2;
    const next = { ...value };
    if (event.key === "ArrowLeft") next.h = (value.h - step + 360) % 360;
    else if (event.key === "ArrowRight") next.h = (value.h + step) % 360;
    else if (event.key === "ArrowUp") next.s = Math.min(1, value.s + step / 100);
    else if (event.key === "ArrowDown") next.s = Math.max(0, value.s - step / 100);
    else return;
    event.preventDefault();
    onChange(next);
  }

  const angle = (value.h * Math.PI) / 180;
  const thumbX = Math.cos(angle) * value.s * 50;
  const thumbY = Math.sin(angle) * value.s * 50;

  return (
    <div
      ref={wheelRef}
      className="color-wheel"
      role="slider"
      tabIndex={0}
      aria-label="Hue and saturation"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(value.h)}
      aria-valuetext={`Hue ${Math.round(value.h)} degrees, saturation ${Math.round(value.s * 100)}%`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onKeyDown={onKeyDown}
    >
      <div className="color-wheel-shade" style={{ opacity: 1 - value.v }} />
      <span
        className="color-wheel-thumb"
        style={{
          left: `${50 + thumbX}%`,
          top: `${50 + thumbY}%`,
          background: hsvToHex(value),
        }}
      />
    </div>
  );
}
