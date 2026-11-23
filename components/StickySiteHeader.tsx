"use client";

import { ArrowUpRight, ChevronDown, FileText, Mail, MapPin, type LucideIcon } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import type { SiteLinks } from "@/lib/site";

export type HeaderSection = {
  id: string;
  label: string;
};

type HeaderCopy = {
  eyebrow: string;
  title: string;
  description: string;
  role?: string;
  location?: string;
  availability?: string;
  links?: SiteLinks;
};

type StickySiteHeaderProps = HeaderCopy & {
  sections: HeaderSection[];
};

type FoldName = "eyebrow" | "role" | "tagline" | "links";
const FOLD_NAMES: FoldName[] = ["eyebrow", "role", "tagline", "links"];

type HeaderMetrics = {
  pinned: boolean;
  progress: number;
  top: number;
  left: number;
  width: number;
  height: number;
  padX: number;
  padY: number;
  folds: Partial<Record<FoldName, number>>;
  navWidth: number;
  nameSize: number;
};

type HeroLink = {
  href: string;
  label: string;
  icon?: LucideIcon;
  external: boolean;
};

const subscribeNoop = () => () => {};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t);
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

const COMPACT_PAD_Y = 14;
const COMPACT_HEIGHT = 64;
const RADIUS = 18.4;
const ISLAND_RADIUS = 22;
const ISLAND_TOP = 12;
const ISLAND_PAD_X = 22;
// A section becomes "current" once its top passes this fraction of the viewport.
const ACTIVE_LINE = 0.35;

function heroLinks(links: SiteLinks | undefined): HeroLink[] {
  if (!links) return [];
  const items: (HeroLink | null)[] = [
    links.github ? { href: links.github, label: "GitHub", external: true } : null,
    links.linkedin ? { href: links.linkedin, label: "LinkedIn", external: true } : null,
    links.email ? { href: `mailto:${links.email}`, label: "Email", icon: Mail, external: false } : null,
    links.resume ? { href: links.resume, label: "Résumé", icon: FileText, external: true } : null,
  ];
  return items.filter((item): item is HeroLink => item !== null);
}

type HeaderContentProps = HeaderCopy & {
  sections: HeaderSection[];
  activeId: string | null;
  menuOpen?: boolean;
  onToggleMenu?: () => void;
  navRef?: Ref<HTMLElement>;
  menuButtonRef?: Ref<HTMLButtonElement>;
  linkRef?: (id: string, element: HTMLAnchorElement | null) => void;
  // The hidden copy used only to measure the full-size intro.
  ghost?: boolean;
};

function HeaderContent({
  eyebrow,
  title,
  description,
  role,
  location,
  availability,
  links,
  sections,
  activeId,
  menuOpen = false,
  onToggleMenu,
  navRef,
  menuButtonRef,
  linkRef,
  ghost = false,
}: HeaderContentProps) {
  const Name = ghost ? "p" : "h1";
  const items = heroLinks(links);
  const activeLabel = sections.find((section) => section.id === activeId)?.label;

  return (
    <>
      <div className="hero-fold hero-top" data-fold="eyebrow">
        <p className="eyebrow">{eyebrow}</p>
        {availability ? (
          <p className="hero-availability">
            <span className="hero-availability-dot" aria-hidden="true" />
            {availability}
          </p>
        ) : null}
      </div>

      <div className="site-header-morph-row">
        <div className="site-header-morph-identity">
          <Name className="site-header-morph-name">{title}</Name>

          {role || location ? (
            <p className="hero-fold hero-role" data-fold="role">
              {role ? <span>{role}</span> : null}
              {role && location ? <span className="hero-role-sep" aria-hidden="true" /> : null}
              {location ? (
                <span className="hero-location">
                  <MapPin size={15} aria-hidden="true" />
                  {location}
                </span>
              ) : null}
            </p>
          ) : null}

          <p className="hero-fold site-header-morph-tagline" data-fold="tagline">
            {description}
          </p>

          {items.length > 0 ? (
            <div className="hero-fold hero-links" data-fold="links">
              {items.map(({ href, label, icon: Icon, external }) => (
                <a
                  key={label}
                  href={href}
                  className="hero-link"
                  {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                >
                  {Icon ? <Icon size={15} aria-hidden="true" /> : null}
                  {label}
                  {external ? <ArrowUpRight size={14} aria-hidden="true" /> : null}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {sections.length > 0 ? (
          <>
            <nav className="island-nav" aria-label="Sections" ref={navRef}>
              <span className="island-nav-pill" aria-hidden="true" />
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`island-link${section.id === activeId ? " is-active" : ""}`}
                  aria-current={section.id === activeId ? "true" : undefined}
                  ref={linkRef ? (element) => linkRef(section.id, element) : undefined}
                >
                  {section.label}
                </a>
              ))}
            </nav>

            <button
              ref={menuButtonRef}
              type="button"
              className={`island-menu-button${menuOpen ? " is-open" : ""}`}
              aria-expanded={ghost ? undefined : menuOpen}
              aria-controls={ghost ? undefined : "island-menu"}
              onClick={onToggleMenu}
            >
              <span>{activeLabel ?? "Sections"}</span>
              <ChevronDown size={15} aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>
    </>
  );
}

export function StickySiteHeader({ sections, ...copy }: StickySiteHeaderProps) {
  const placeholderRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const portalTarget = useSyncExternalStore(
    subscribeNoop,
    () => document.getElementById("site-top-layer"),
    () => null,
  );
  const [metrics, setMetrics] = useState<HeaderMetrics>({
    pinned: false,
    progress: 0,
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    padX: 0,
    padY: 0,
    folds: {},
    navWidth: 0,
    nameSize: 0,
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    let fit = { navWidth: 0, nameSize: 0 };

    // Layout-dependent sizing that only changes on resize or font load. The
    // intro lets the name use the full width (the section links sit beside the
    // link row instead), and scales the name down only if it still can't fit.
    function fitIntro() {
      const placeholder = placeholderRef.current;
      if (!placeholder) return;
      const nav = Array.from(
        placeholder.querySelectorAll<HTMLElement>(".island-nav, .island-menu-button"),
      ).find((element) => element.offsetParent !== null);
      const navWidth = nav?.offsetWidth ?? 0;
      placeholder.style.setProperty("--nav-w", `${navWidth}px`);

      const name = placeholder.querySelector<HTMLElement>(".site-header-morph-name");
      let nameSize = 0;
      if (name) {
        placeholder.style.removeProperty("--hero-name-fit");
        const natural = parseFloat(getComputedStyle(name).fontSize);
        const overflow = name.scrollWidth / Math.max(name.clientWidth, 1);
        nameSize = overflow > 1 ? Math.floor((natural / overflow) * 0.98) : natural;
        placeholder.style.setProperty("--hero-name-fit", `${nameSize}px`);
      }
      fit = { navWidth, nameSize };
    }

    function measure() {
      const placeholder = placeholderRef.current;
      if (!placeholder) return;

      const rect = placeholder.getBoundingClientRect();
      const computed = getComputedStyle(placeholder);
      const heroPadY = parseFloat(computed.paddingTop) || 0;
      const heroPadX = parseFloat(computed.paddingLeft) || 0;

      const folds: HeaderMetrics["folds"] = {};
      for (const name of FOLD_NAMES) {
        const element = placeholder.querySelector<HTMLElement>(`[data-fold="${name}"]`);
        if (element) folds[name] = element.offsetHeight;
      }

      // Pins a little below the viewport edge so it floats as an island. The
      // ease-out shrink keeps the header's bottom edge ahead of the content.
      const pinned = rect.top <= ISLAND_TOP;
      const morphDistance = Math.max(rect.height, 160);
      const rawProgress = pinned ? clamp((ISLAND_TOP - rect.top) / morphDistance, 0, 1) : 0;
      const progress = easeOutQuad(rawProgress);
      const shrink = clamp(progress / 0.85, 0, 1);

      setMetrics({
        pinned,
        progress,
        top: pinned ? ISLAND_TOP : rect.top,
        // The island keeps the placeholder's width so it lines up with the content below.
        left: rect.left,
        width: rect.width,
        height: rect.height,
        padX: lerp(heroPadX, ISLAND_PAD_X, shrink),
        padY: lerp(heroPadY, COMPACT_PAD_Y, progress),
        folds,
        navWidth: fit.navWidth,
        nameSize: fit.nameSize,
      });

      const line = window.innerHeight * ACTIVE_LINE;
      let current: string | null = null;
      for (const { id } of sections) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= line) current = id;
      }
      // Short final sections may never reach the line, so the bottom of the page wins.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && sections.length > 0) current = sections[sections.length - 1].id;
      setActiveId(current);
    }

    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }

    function onResize() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        fitIntro();
        measure();
      });
    }

    fitIntro();
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // Web fonts change the intro's size after first paint.
    document.fonts?.ready.then(onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [sections]);

  // Position the sliding pill under the active link. Written straight to CSS
  // variables so scrolling doesn't cause extra React renders.
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const link = activeId ? linkRefs.current.get(activeId) : undefined;
    if (!link) {
      nav.style.setProperty("--pill-opacity", "0");
      return;
    }
    nav.style.setProperty("--pill-x", `${link.offsetLeft}px`);
    nav.style.setProperty("--pill-w", `${link.offsetWidth}px`);
    nav.style.setProperty("--pill-opacity", "1");
    const frame = requestAnimationFrame(() => nav.setAttribute("data-ready", ""));
    return () => cancelAnimationFrame(frame);
  }, [activeId, metrics.width, portalTarget]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !menuButtonRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const height =
    metrics.height > 0
      ? metrics.height + (COMPACT_HEIGHT - metrics.height) * metrics.progress
      : undefined;
  const borderRadius = lerp(RADIUS, ISLAND_RADIUS, metrics.progress);

  const style = {
    top: metrics.top,
    left: metrics.left,
    width: metrics.width,
    height,
    padding: `${metrics.padY}px ${metrics.padX}px`,
    borderRadius,
    ["--morph"]: String(metrics.progress),
    ["--nav-w"]: `${metrics.navWidth}px`,
    ...(metrics.nameSize ? { ["--hero-name-fit"]: `${metrics.nameSize}px` } : {}),
    ...Object.fromEntries(
      Object.entries(metrics.folds).map(([name, value]) => [`--fold-${name}`, `${value}px`]),
    ),
  } as CSSProperties;

  const header =
    portalTarget &&
    metrics.width > 0 &&
    createPortal(
      <>
        <header
          className={`site-header-morph${metrics.pinned ? " is-pinned" : ""}${
            metrics.progress > 0.45 ? " is-compact" : ""
          }`}
          style={style}
        >
          <HeaderContent
            {...copy}
            sections={sections}
            activeId={activeId}
            menuOpen={menuOpen}
            onToggleMenu={() => setMenuOpen((open) => !open)}
            navRef={navRef}
            menuButtonRef={menuButtonRef}
            linkRef={(id, element) => {
              if (element) linkRefs.current.set(id, element);
              else linkRefs.current.delete(id);
            }}
          />
        </header>

        {menuOpen ? (
          <div
            id="island-menu"
            ref={menuRef}
            className="island-menu"
            style={{ top: metrics.top + (height ?? 0) + 8, left: metrics.left + metrics.width }}
          >
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`island-menu-link${section.id === activeId ? " is-active" : ""}`}
                aria-current={section.id === activeId ? "true" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {section.label}
              </a>
            ))}
          </div>
        ) : null}
      </>,
      portalTarget,
    );

  return (
    <div className="site-header-block">
      <div
        ref={placeholderRef}
        className="site-header-morph site-header-ghost"
        aria-hidden="true"
        inert
      >
        <HeaderContent {...copy} sections={sections} activeId={null} ghost />
      </div>
      {header}
    </div>
  );
}
