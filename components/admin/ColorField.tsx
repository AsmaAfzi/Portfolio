"use client";

import { ChevronDown, Pipette, Sun } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ColorWheel } from "@/components/admin/ColorWheel";
import { hexToHsv, hsvToHex, normalizeHex, type Hsv } from "@/lib/color";

type EyeDropperConstructor = new () => { open: () => Promise<{ sRGBHex: string }> };

type ColorFieldProps = {
  label: string;
  hint?: string;
  value: string;
  swatches: string[];
  onChange: (value: string) => void;
};

const FALLBACK_HSV: Hsv = { h: 160, s: 0.3, v: 0.75 };
// Approximate rendered height (plus the sticky save bar) used to decide whether to flip upward.
const POPOVER_HEIGHT = 440;

export function ColorField({ label, hint, value, swatches, onChange }: ColorFieldProps) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      className={`color-field${open ? " is-open" : ""}${above ? " opens-above" : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="color-field-trigger"
        aria-expanded={open}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setAbove(window.innerHeight - rect.bottom < POPOVER_HEIGHT && rect.top > POPOVER_HEIGHT);
          setOpen((current) => !current);
        }}
      >
        <span className="color-swatch" style={{ background: value }} />
        <span className="color-field-text">
          <span className="color-field-label">{label}</span>
          <span className="color-field-value">{value}</span>
        </span>
        <ChevronDown className="color-field-chevron" size={16} aria-hidden="true" />
      </button>
      {hint ? <small className="color-field-hint">{hint}</small> : null}
      {open ? (
        <ColorPopover label={label} value={value} swatches={swatches} onChange={onChange} />
      ) : null}
    </div>
  );
}

type ColorPopoverProps = Omit<ColorFieldProps, "hint">;

function ColorPopover({ label, value, swatches, onChange }: ColorPopoverProps) {
  // Track HSV separately so hue survives when saturation or brightness hits zero.
  const [color, setColor] = useState(() => ({
    hex: value,
    hsv: hexToHsv(value) ?? FALLBACK_HSV,
  }));
  const [draft, setDraft] = useState(value);

  if (color.hex !== value) {
    setColor({ hex: value, hsv: hexToHsv(value) ?? color.hsv });
    setDraft(value);
  }

  const canEyedrop = "EyeDropper" in window;

  function emitHsv(hsv: Hsv) {
    const hex = hsvToHex(hsv);
    setColor({ hex, hsv });
    setDraft(hex);
    onChange(hex);
  }

  function emitHex(raw: string) {
    const hex = normalizeHex(raw);
    if (!hex) return false;
    setColor((current) => ({ hex, hsv: hexToHsv(hex) ?? current.hsv }));
    setDraft(hex);
    onChange(hex);
    return true;
  }

  async function eyedrop() {
    const EyeDropper = (window as unknown as { EyeDropper: EyeDropperConstructor }).EyeDropper;
    try {
      const result = await new EyeDropper().open();
      emitHex(result.sRGBHex);
    } catch {
      // User dismissed the picker.
    }
  }

  const fullBrightness = hsvToHex({ ...color.hsv, v: 1 });

  return (
    <div className="color-popover" role="dialog" aria-label={`${label} color`}>
      <ColorWheel value={color.hsv} onChange={emitHsv} />

      <label className="color-slider-row">
        <Sun size={14} aria-hidden="true" />
        <span className="sr-only">Brightness</span>
        <input
          type="range"
          className="color-slider"
          min={0}
          max={100}
          value={Math.round(color.hsv.v * 100)}
          style={{ "--slider-track": `linear-gradient(90deg, #000, ${fullBrightness})` } as CSSProperties}
          onChange={(event) => emitHsv({ ...color.hsv, v: Number(event.target.value) / 100 })}
        />
      </label>

      <div className="color-popover-row">
        <span className="color-swatch color-swatch-lg" style={{ background: value }} />
        <input
          className="color-hex"
          value={draft}
          spellCheck={false}
          aria-label="Hex value"
          onChange={(event) => {
            setDraft(event.target.value);
            if (/^#?[0-9a-f]{6}$/i.test(event.target.value.trim())) emitHex(event.target.value);
          }}
          onBlur={() => {
            if (!emitHex(draft)) setDraft(value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (!emitHex(draft)) setDraft(value);
            }
          }}
        />
        {canEyedrop ? (
          <button type="button" className="icon-button" onClick={eyedrop} title="Pick from screen">
            <Pipette size={15} aria-hidden="true" />
            <span className="sr-only">Pick a color from the screen</span>
          </button>
        ) : null}
      </div>

      <div className="color-swatches" role="group" aria-label="Palette">
        {swatches.map((swatch) => (
          <button
            key={swatch}
            type="button"
            className={`color-swatch-button${swatch === value ? " is-active" : ""}`}
            style={{ background: swatch }}
            title={swatch}
            onClick={() => emitHex(swatch)}
          >
            <span className="sr-only">Use {swatch}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
