"use client";

type SegmentedFieldProps = {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
};

export function SegmentedField({ label, value, options, onChange }: SegmentedFieldProps) {
  return (
    <div className="range-field">
      <span className="range-field-head">
        <span>{label}</span>
      </span>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            className={`segmented-option${option.value === value ? " is-active" : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
