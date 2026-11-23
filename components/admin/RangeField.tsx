"use client";

import type { CSSProperties } from "react";

type RangeFieldProps = {
  label: string;
  hint?: string;
  value: string;
  min: number;
  max: number;
  step: number;
  /** Unit appended to the number, e.g. "rem". Empty for unitless values. */
  unit: string;
  format?: (value: number) => string;
  onChange: (value: string) => void;
};

const NUMBER_WITH_UNIT = /^(-?\d*\.?\d+)([a-z%]*)$/i;

export function RangeField({
  label,
  hint,
  value,
  min,
  max,
  step,
  unit,
  format,
  onChange,
}: RangeFieldProps) {
  const match = NUMBER_WITH_UNIT.exec(value.trim());

  // Values like clamp(...) can't be represented by a slider; edit them as text.
  if (!match || (match[2] && match[2] !== unit)) {
    return (
      <label className="cms-field range-field">
        <span>{label}</span>
        <input value={value} onChange={(event) => onChange(event.target.value)} />
        {hint ? <small>{hint}</small> : null}
      </label>
    );
  }

  const number = Number.parseFloat(match[1]);
  const progress = ((Math.min(max, Math.max(min, number)) - min) / (max - min)) * 100;

  return (
    <label className="range-field">
      <span className="range-field-head">
        <span>{label}</span>
        <output>{format ? format(number) : `${number}${unit}`}</output>
      </span>
      <input
        type="range"
        className="range-input"
        min={min}
        max={max}
        step={step}
        value={number}
        style={{ "--range-progress": `${progress}%` } as CSSProperties}
        onChange={(event) => onChange(`${event.target.value}${unit}`)}
      />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}
