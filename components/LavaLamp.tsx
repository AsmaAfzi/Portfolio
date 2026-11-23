"use client";

import { useEffect, useRef } from "react";

// The canvas renders at a fraction of its displayed size; CSS upscales and blurs it,
// which keeps the per-pixel metaball math cheap.
const RENDER_SCALE = 0.12;
const FRAME_MS = 1000 / 30;

type Blob = {
  x: number;
  r: number;
  rise: number;
  sway: number;
  phase: number;
  tone: 0 | 1 | 2;
};

const BLOBS: Blob[] = [
  { x: 0.18, r: 0.2, rise: 0.05, sway: 0.06, phase: 0, tone: 0 },
  { x: 0.42, r: 0.15, rise: 0.07, sway: 0.08, phase: 2.1, tone: 1 },
  { x: 0.7, r: 0.22, rise: 0.04, sway: 0.05, phase: 4.2, tone: 2 },
  { x: 0.88, r: 0.14, rise: 0.08, sway: 0.07, phase: 1.3, tone: 0 },
  { x: 0.3, r: 0.12, rise: 0.09, sway: 0.1, phase: 3.4, tone: 1 },
  { x: 0.58, r: 0.17, rise: 0.06, sway: 0.06, phase: 5.5, tone: 0 },
  { x: 0.08, r: 0.13, rise: 0.065, sway: 0.05, phase: 0.8, tone: 2 },
];

type Rgb = [number, number, number];

const FALLBACK_TONES: Rgb[] = [
  [138, 191, 178],
  [196, 196, 219],
  [37, 27, 40],
];

// Pointer interaction, in fractions of the canvas's shorter side.
const CURSOR_RADIUS = 0.085;
const CURSOR_SPEED_BOOST = 0.06;
const PUSH_RADIUS = 0.32;
const PUSH_FORCE = 0.6;
const SPRING = 0.035;
const DAMPING = 0.86;
const FOLLOW = 0.14;

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function LavaLamp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    const root = document.documentElement;

    let width = 0;
    let height = 0;
    let image = ctx.createImageData(1, 1);
    let tones: Rgb[] = FALLBACK_TONES;
    let speed = 1;
    let time = 12;
    let last = performance.now();
    let frame = 0;
    let bounds = canvas.getBoundingClientRect();

    // The cursor is its own blob of wax that trails the pointer and merges with
    // the others; nearby blobs are pushed aside and spring back.
    const pointer = { x: 0.5, y: 0.5, active: false };
    const cursor = { x: 0.5, y: 0.5, strength: 0, boost: 0 };
    const offsets = BLOBS.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }));

    function toRgb(value: string, fallback: Rgb): Rgb {
      if (!probe || !value.trim()) return fallback;
      probe.fillStyle = `rgb(${fallback.join(",")})`;
      probe.fillStyle = value.trim();
      probe.clearRect(0, 0, 1, 1);
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
      return [r, g, b];
    }

    function readConfig() {
      const styles = getComputedStyle(root);
      tones = [
        toRgb(styles.getPropertyValue("--accent"), FALLBACK_TONES[0]),
        toRgb(styles.getPropertyValue("--secondary"), FALLBACK_TONES[1]),
        toRgb(styles.getPropertyValue("--background-alt"), FALLBACK_TONES[2]),
      ];
      const parsedSpeed = Number.parseFloat(styles.getPropertyValue("--lava-speed"));
      speed = Number.isFinite(parsedSpeed) ? Math.max(0, parsedSpeed) : 1;
    }

    function resize() {
      if (!canvas || !ctx) return;
      width = Math.max(32, Math.round(canvas.clientWidth * RENDER_SCALE));
      height = Math.max(32, Math.round(canvas.clientHeight * RENDER_SCALE));
      canvas.width = width;
      canvas.height = height;
      image = ctx.createImageData(width, height);
      bounds = canvas.getBoundingClientRect();
    }

    // Base position of each blob in canvas pixels, before the pointer's push.
    function basePosition(blob: Blob) {
      return {
        x: (blob.x + Math.sin(time * 0.13 + blob.phase) * blob.sway) * width,
        // Each blob drifts the full height of the screen and back, like wax in a lamp.
        y: (0.5 + Math.sin(time * blob.rise + blob.phase) * 0.55) * height,
      };
    }

    function stepInteraction() {
      const previousX = cursor.x;
      const previousY = cursor.y;
      cursor.x += (pointer.x - cursor.x) * FOLLOW;
      cursor.y += (pointer.y - cursor.y) * FOLLOW;
      cursor.strength += ((pointer.active ? 1 : 0) - cursor.strength) * 0.08;
      // Fast movement swells the cursor blob a little, then it settles.
      const travel = Math.hypot((cursor.x - previousX) * width, (cursor.y - previousY) * height);
      cursor.boost += (Math.min(1, travel / (Math.min(width, height) * 0.04)) - cursor.boost) * 0.15;

      const unit = Math.min(width, height);
      const cx = cursor.x * width;
      const cy = cursor.y * height;
      const reach = PUSH_RADIUS * unit;
      for (let i = 0; i < BLOBS.length; i++) {
        const offset = offsets[i];
        const base = basePosition(BLOBS[i]);
        const dx = base.x + offset.x - cx;
        const dy = base.y + offset.y - cy;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance < reach && cursor.strength > 0.01) {
          const push = (1 - distance / reach) ** 2 * PUSH_FORCE * cursor.strength;
          offset.vx += (dx / distance) * push;
          offset.vy += (dy / distance) * push;
        }
        offset.vx = (offset.vx - offset.x * SPRING) * DAMPING;
        offset.vy = (offset.vy - offset.y * SPRING) * DAMPING;
        offset.x += offset.vx;
        offset.y += offset.vy;
      }
    }

    function draw() {
      if (!ctx) return;
      const unit = Math.min(width, height);
      const count = BLOBS.length + 1;
      const bx = new Float32Array(count);
      const by = new Float32Array(count);
      const rr = new Float32Array(count);
      const toneOf = new Uint8Array(count);

      for (let i = 0; i < BLOBS.length; i++) {
        const blob = BLOBS[i];
        const base = basePosition(blob);
        bx[i] = base.x + offsets[i].x;
        by[i] = base.y + offsets[i].y;
        const radius = blob.r * unit * (1 + 0.12 * Math.sin(time * 0.5 + blob.phase * 1.7));
        rr[i] = radius * radius;
        toneOf[i] = blob.tone;
      }

      const cursorIndex = BLOBS.length;
      bx[cursorIndex] = cursor.x * width;
      by[cursorIndex] = cursor.y * height;
      const cursorRadius =
        (CURSOR_RADIUS + CURSOR_SPEED_BOOST * cursor.boost) * unit * cursor.strength;
      rr[cursorIndex] = cursorRadius * cursorRadius;
      toneOf[cursorIndex] = 0;

      const data = image.data;
      let index = 0;
      for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
          let field = 0;
          let red = 0;
          let green = 0;
          let blue = 0;
          for (let i = 0; i < count; i++) {
            const dx = px - bx[i];
            const dy = py - by[i];
            const contribution = rr[i] / (dx * dx + dy * dy + 1);
            const tone = tones[toneOf[i]];
            field += contribution;
            red += tone[0] * contribution;
            green += tone[1] * contribution;
            blue += tone[2] * contribution;
          }

          const alpha = smoothstep(0.75, 1.3, field);
          if (alpha === 0) {
            data[index + 3] = 0;
          } else {
            const glow = Math.min(1.12, 0.9 + field * 0.06);
            data[index] = Math.min(255, (red / field) * glow);
            data[index + 1] = Math.min(255, (green / field) * glow);
            data[index + 2] = Math.min(255, (blue / field) * glow);
            data[index + 3] = alpha * 200;
          }
          index += 4;
        }
      }

      ctx.putImageData(image, 0, 0);
    }

    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      const elapsed = now - last;
      if (elapsed < FRAME_MS) return;
      last = now;
      time += Math.min(elapsed, 100) * 0.001 * speed;
      stepInteraction();
      draw();
    }

    readConfig();
    resize();
    draw();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) frame = requestAnimationFrame(tick);

    const onResize = () => {
      resize();
      draw();
    };
    window.addEventListener("resize", onResize);

    const onPointerMove = (event: PointerEvent) => {
      if (bounds.width === 0 || bounds.height === 0) return;
      pointer.x = (event.clientX - bounds.left) / bounds.width;
      pointer.y = (event.clientY - bounds.top) / bounds.height;
      if (!pointer.active) {
        // Appear where the pointer is rather than sliding in from the last spot.
        cursor.x = pointer.x;
        cursor.y = pointer.y;
      }
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };
    if (!reduceMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
      window.addEventListener("blur", onPointerLeave);
    }

    // Live theme previews set CSS variables inline on <html>; saved themes swap the <style> tag.
    const observer = new MutationObserver(() => {
      readConfig();
      if (reduceMotion) draw();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["style", "class"] });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="lava-lamp" aria-hidden="true" />;
}
