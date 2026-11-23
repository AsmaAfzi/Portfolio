"use client";

import {
  Check,
  ChevronDown,
  Droplets,
  ExternalLink,
  Loader2,
  Monitor,
  Palette,
  Ruler,
  Smartphone,
  Sparkles,
  Square,
  Tablet,
  Type,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { ColorField } from "@/components/admin/ColorField";
import { RangeField } from "@/components/admin/RangeField";
import { SegmentedField } from "@/components/admin/SegmentedField";
import { defaultTheme, themeToCssVars, type ThemeConfig } from "@/lib/theme-shared";

type ThemeFormProps = {
  initialTheme: ThemeConfig;
};

type ColorKey = keyof ThemeConfig["colors"];

const COLOR_GROUPS: { title: string; fields: { key: ColorKey; label: string; hint: string }[] }[] = [
  {
    title: "Backdrop",
    fields: [
      { key: "background", label: "Background", hint: "Main page color" },
      { key: "backgroundAlt", label: "Blend color", hint: "Gradient end, dark lava blobs" },
      { key: "backgroundText", label: "Heading text", hint: "Section titles on the backdrop" },
    ],
  },
  {
    title: "Cards",
    fields: [
      { key: "card", label: "Card surface", hint: "Panels and project cards" },
      { key: "cardBorder", label: "Card border", hint: "Outline around cards" },
      { key: "foreground", label: "Card text", hint: "Headings and body copy" },
      { key: "muted", label: "Secondary text", hint: "Descriptions and dates" },
    ],
  },
  {
    title: "Accents",
    fields: [
      { key: "accent", label: "Accent", hint: "Buttons, links, lava blobs" },
      { key: "accentForeground", label: "Text on accent", hint: "Button labels" },
      { key: "secondary", label: "Soft accent", hint: "Pills, gradients, lava blobs" },
    ],
  },
];

const PALETTE = ["#ffffff", "#c4c4db", "#8abfb2", "#01332b", "#251b28"];

const PRESETS: { name: string; colors: ThemeConfig["colors"] }[] = [
  { name: "Evergreen", colors: defaultTheme.colors },
  {
    name: "Plum night",
    colors: {
      ...defaultTheme.colors,
      background: "#251b28",
      backgroundAlt: "#01332b",
      backgroundText: "#f2eff5",
      accent: "#c4c4db",
      accentForeground: "#251b28",
      secondary: "#8abfb2",
    },
  },
  {
    name: "Soft light",
    colors: {
      background: "#e9e9f2",
      backgroundAlt: "#c4c4db",
      backgroundText: "#251b28",
      foreground: "#251b28",
      muted: "#5f5a67",
      card: "#ffffff",
      cardBorder: "#dcdcea",
      accent: "#01332b",
      accentForeground: "#ffffff",
      secondary: "#8abfb2",
    },
  },
];

const DEVICES: Record<"desktop" | "tablet" | "mobile", { label: string; width: number; icon: LucideIcon }> = {
  desktop: { label: "Desktop", width: 1280, icon: Monitor },
  tablet: { label: "Tablet", width: 820, icon: Tablet },
  mobile: { label: "Phone", width: 390, icon: Smartphone },
};

type Device = keyof typeof DEVICES;
type Status = { type: "idle" | "saving" | "saved" | "error"; message?: string };

const rem = (value: number) => `${value}rem`;
const percent = (value: number) => `${value}%`;

export function ThemeForm({ initialTheme }: ThemeFormProps) {
  const router = useRouter();
  const [theme, setTheme] = useState(initialTheme);
  const [saved, setSaved] = useState(initialTheme);
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [device, setDevice] = useState<Device>("desktop");
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const frameRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const dirty = JSON.stringify(theme) !== JSON.stringify(saved);
  const saving = status.type === "saving";
  const swatches = Array.from(
    new Set([...PALETTE, ...Object.values(theme.colors).map((color) => color.toLowerCase())]),
  ).slice(0, 14);

  function update<K extends keyof ThemeConfig>(section: K, key: keyof ThemeConfig[K], value: string) {
    setTheme((current) => ({ ...current, [section]: { ...current[section], [key]: value } }));
    if (status.type === "saved" || status.type === "error") setStatus({ type: "idle" });
  }

  const applyPreview = useCallback(() => {
    const root = frameRef.current?.contentDocument?.documentElement;
    if (!root) return;
    for (const [name, value] of Object.entries(themeToCssVars(theme))) {
      root.style.setProperty(name, value);
    }
  }, [theme]);

  useEffect(() => {
    applyPreview();
  }, [applyPreview]);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setStage({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ type: "saving" });

    const response = await fetch("/api/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(theme),
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setStatus({ type: "error", message: data.error ?? "Could not save theme." });
      return;
    }

    setSaved(theme);
    setStatus({ type: "saved" });
    router.refresh();
  }

  const deviceWidth = DEVICES[device].width;
  const scale = stage.width ? Math.min(1, stage.width / deviceWidth) : 1;
  const frameStyle: CSSProperties = {
    width: deviceWidth,
    height: stage.height ? stage.height / scale : "100%",
    transform: `scale(${scale})`,
    left: Math.max(0, (stage.width - deviceWidth * scale) / 2),
  };

  const statusText =
    status.type === "saving"
      ? "Publishing…"
      : status.type === "error"
        ? status.message
        : dirty
          ? "Unsaved changes. Only the preview has changed."
          : status.type === "saved"
            ? "Published. Your live site is updated."
            : "Everything is published.";

  return (
    <form className="theme-editor" onSubmit={onSubmit}>
      <div className="theme-editor-controls">
        <EditorSection icon={Sparkles} title="Presets" description="Start from a ready-made palette">
          <div className="preset-grid">
            {PRESETS.map((preset) => {
              const active = JSON.stringify(preset.colors) === JSON.stringify(theme.colors);
              return (
                <button
                  key={preset.name}
                  type="button"
                  className={`preset${active ? " is-active" : ""}`}
                  onClick={() => setTheme((current) => ({ ...current, colors: preset.colors }))}
                >
                  <span className="preset-swatches" aria-hidden="true">
                    {[
                      preset.colors.background,
                      preset.colors.backgroundAlt,
                      preset.colors.accent,
                      preset.colors.secondary,
                      preset.colors.card,
                    ].map((color, index) => (
                      <span key={index} style={{ background: color }} />
                    ))}
                  </span>
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </EditorSection>

        <EditorSection icon={Palette} title="Colors" description="Click a swatch to open the color wheel">
          {COLOR_GROUPS.map((group) => (
            <div className="editor-subgroup" key={group.title}>
              <h3>{group.title}</h3>
              <div className="color-grid">
                {group.fields.map((field) => (
                  <ColorField
                    key={field.key}
                    label={field.label}
                    hint={field.hint}
                    value={theme.colors[field.key]}
                    swatches={swatches}
                    onChange={(value) => update("colors", field.key, value)}
                  />
                ))}
              </div>
            </div>
          ))}
        </EditorSection>

        <EditorSection icon={Droplets} title="Lava background" description="The moving blobs behind the page">
          <RangeField
            label="Blur"
            value={theme.effects.lavaBlur}
            min={0}
            max={100}
            step={1}
            unit=""
            format={percent}
            onChange={(value) => update("effects", "lavaBlur", value)}
          />
          <RangeField
            label="Intensity"
            value={theme.effects.lavaIntensity}
            min={0}
            max={100}
            step={1}
            unit=""
            format={percent}
            onChange={(value) => update("effects", "lavaIntensity", value)}
          />
          <RangeField
            label="Speed"
            value={theme.effects.lavaSpeed}
            min={0}
            max={3}
            step={0.1}
            unit=""
            format={(value) => (value === 0 ? "Paused" : `${value}×`)}
            onChange={(value) => update("effects", "lavaSpeed", value)}
          />
        </EditorSection>

        <EditorSection icon={Square} title="Corners" description="How rounded things are" defaultOpen={false}>
          <RangeField
            label="Cards"
            value={theme.radius.card}
            min={0}
            max={2.5}
            step={0.05}
            unit="rem"
            format={rem}
            onChange={(value) => update("radius", "card", value)}
          />
          <RangeField
            label="Buttons and inputs"
            value={theme.radius.button}
            min={0}
            max={1.5}
            step={0.05}
            unit="rem"
            format={rem}
            onChange={(value) => update("radius", "button", value)}
          />
          <RangeField
            label="Images"
            value={theme.radius.image}
            min={0}
            max={2}
            step={0.05}
            unit="rem"
            format={rem}
            onChange={(value) => update("radius", "image", value)}
          />
          <SegmentedField
            label="Tags and pills"
            value={theme.radius.pill}
            options={[
              { label: "Square", value: "0.35rem" },
              { label: "Soft", value: "0.75rem" },
              { label: "Round", value: "9999px" },
            ]}
            onChange={(value) => update("radius", "pill", value)}
          />
        </EditorSection>

        <EditorSection icon={Ruler} title="Spacing" description="Breathing room and page width" defaultOpen={false}>
          <RangeField
            label="Card padding"
            value={theme.spacing.cardPadding}
            min={0.75}
            max={3}
            step={0.05}
            unit="rem"
            format={rem}
            onChange={(value) => update("spacing", "cardPadding", value)}
          />
          <RangeField
            label="Gap between sections"
            value={theme.spacing.sectionGap}
            min={0.5}
            max={4}
            step={0.1}
            unit="rem"
            format={rem}
            onChange={(value) => update("spacing", "sectionGap", value)}
          />
          <RangeField
            label="Page width"
            value={theme.spacing.pageWidth}
            min={48}
            max={96}
            step={1}
            unit="rem"
            format={rem}
            onChange={(value) => update("spacing", "pageWidth", value)}
          />
        </EditorSection>

        <EditorSection icon={Type} title="Typography" description="Heading and label sizes" defaultOpen={false}>
          <RangeField
            label="Title size"
            value={theme.typography.titleSize}
            min={1.4}
            max={4}
            step={0.05}
            unit="rem"
            format={rem}
            onChange={(value) => update("typography", "titleSize", value)}
          />
          <RangeField
            label="Eyebrow label size"
            value={theme.typography.eyebrowSize}
            min={0.6}
            max={1}
            step={0.01}
            unit="rem"
            format={rem}
            onChange={(value) => update("typography", "eyebrowSize", value)}
          />
        </EditorSection>
      </div>

      <aside className="theme-preview" aria-label="Live preview">
        <div className="theme-preview-bar">
          <span className="theme-preview-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="theme-preview-label">
            <span className="live-dot" aria-hidden="true" />
            Live preview
          </span>
          <div className="segmented segmented-sm" role="radiogroup" aria-label="Preview size">
            {(Object.keys(DEVICES) as Device[]).map((key) => {
              const { icon: Icon, label } = DEVICES[key];
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={device === key}
                  className={`segmented-option${device === key ? " is-active" : ""}`}
                  onClick={() => setDevice(key)}
                  title={label}
                >
                  <Icon size={15} aria-hidden="true" />
                  <span className="sr-only">{label}</span>
                </button>
              );
            })}
          </div>
          <a className="icon-button" href="/" target="_blank" rel="noreferrer" title="Open site">
            <ExternalLink size={15} aria-hidden="true" />
            <span className="sr-only">Open the live site in a new tab</span>
          </a>
        </div>
        <div className="theme-preview-stage" ref={stageRef}>
          {!previewLoaded ? (
            <div className="theme-preview-loading">
              <Loader2 className="spin" size={18} aria-hidden="true" />
              Loading preview…
            </div>
          ) : null}
          <iframe
            ref={frameRef}
            src="/"
            title="Live site preview"
            className={`theme-preview-frame${previewLoaded ? " is-ready" : ""}`}
            style={frameStyle}
            onLoad={() => {
              setPreviewLoaded(true);
              applyPreview();
            }}
          />
        </div>
      </aside>

      <div className={`theme-savebar${dirty ? " is-dirty" : ""}`}>
        <p
          className={`theme-savebar-status${status.type === "error" ? " is-error" : ""}`}
          role="status"
        >
          {status.type === "saved" && !dirty ? <Check size={15} aria-hidden="true" /> : null}
          {statusText}
        </p>
        <div className="theme-savebar-actions">
          <button
            type="button"
            className="cms-button cms-button-quiet"
            onClick={() => setTheme(defaultTheme)}
          >
            Restore defaults
          </button>
          <button
            type="button"
            className="cms-button cms-button-ghost"
            disabled={!dirty || saving}
            onClick={() => setTheme(saved)}
          >
            <Undo2 size={15} aria-hidden="true" />
            Discard
          </button>
          <button className="cms-button" type="submit" disabled={!dirty || saving}>
            {saving ? (
              <Loader2 className="spin" size={15} aria-hidden="true" />
            ) : (
              <Check size={15} aria-hidden="true" />
            )}
            {saving ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </form>
  );
}

type EditorSectionProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

function EditorSection({ icon: Icon, title, description, defaultOpen = true, children }: EditorSectionProps) {
  return (
    <details className="editor-section" open={defaultOpen}>
      <summary>
        <span className="editor-section-icon" aria-hidden="true">
          <Icon size={16} />
        </span>
        <span className="editor-section-text">
          <span className="editor-section-title">{title}</span>
          <span className="editor-section-desc">{description}</span>
        </span>
        <ChevronDown className="editor-section-chevron" size={16} aria-hidden="true" />
      </summary>
      <div className="editor-section-body">{children}</div>
    </details>
  );
}
