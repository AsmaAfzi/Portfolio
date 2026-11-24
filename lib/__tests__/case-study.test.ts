import { describe, expect, it } from "vitest";
import { parseCaseStudy, summarizeReadme } from "../case-study";

const labelled = `# SAINT-OPS

Problem: Needed to monitor industrial sensors for anomalies in real time
         without having to retrain models from scratch every time.

What I built: End-to-end MLOps platform —
  - FastAPI inference API (served the TensorFlow anomaly model)
  - MLflow for experiment tracking and model versioning
  - Docker + Kubernetes for deployment and scaling
  - Automated retraining pipeline with Airflow

Key challenge: Model drift — sensor readings changed over time.
  I solved this by logging prediction confidence in MLflow and
  triggering retraining when it dropped below a threshold.

What I'd do differently: Use a streaming message queue (Kafka)
  instead of polling for real-time sensor data.

**Impact:** Reduced false-positive alerts by ~40% over baseline threshold model.
`;

describe("parseCaseStudy", () => {
  it("reads inline labels in the portfolio format", () => {
    const sections = parseCaseStudy(labelled);
    expect(sections.map((s) => s.key)).toEqual(["problem", "built", "challenge", "differently", "impact"]);

    expect(sections[0].blocks).toEqual([
      {
        type: "p",
        text: "Needed to monitor industrial sensors for anomalies in real time without having to retrain models from scratch every time.",
      },
    ]);
    expect(sections[1].blocks).toEqual([
      { type: "p", text: "End-to-end MLOps platform —" },
      {
        type: "list",
        items: [
          "FastAPI inference API (served the TensorFlow anomaly model)",
          "MLflow for experiment tracking and model versioning",
          "Docker + Kubernetes for deployment and scaling",
          "Automated retraining pipeline with Airflow",
        ],
      },
    ]);
    expect(sections[3].label).toBe("What I'd do differently");
    expect(sections[4].blocks).toEqual([
      { type: "p", text: "Reduced false-positive alerts by ~40% over baseline threshold model." },
    ]);
  });

  it("maps common README headings, ignoring emoji, code and badges", () => {
    const sections = parseCaseStudy(`# 🌱 EcoCoin
[![build](https://img.shields.io/badge.svg)](https://ci)

# 🔍 Problem
Tourists can't easily verify **eco-friendly** stays.

# 💡 Solution
A booking platform with [escrow](https://example.com) payments.

\`\`\`bash
npm install
\`\`\`

## 📊 Future Enhancements
- Mobile app
- ✅ Carbon tracking
  - nested detail

## 📈 Model Evaluation
| Metric | Value |
|---|---|
MAE dropped to 4.2.
`);
    expect(sections.map((s) => [s.key, s.blocks])).toEqual([
      ["problem", [{ type: "p", text: "Tourists can't easily verify eco-friendly stays." }]],
      ["built", [{ type: "p", text: "A booking platform with escrow payments." }]],
      ["differently", [{ type: "list", items: ["Mobile app", "Carbon tracking"] }]],
      ["impact", [{ type: "p", text: "MAE dropped to 4.2." }]],
    ]);
  });

  it("builds 'What I built' from an overview and a feature list", () => {
    const sections = parseCaseStudy(`# Retail Scanner
## 🚀 Project Overview
Detects products on shelves from CCTV feeds.

## 🎯 Features
- Multi-camera grid
- YOLOv8 detection
### Extra
- Analytics dashboard
`);
    expect(sections).toEqual([
      {
        key: "built",
        label: "What I built",
        blocks: [
          { type: "p", text: "Detects products on shelves from CCTV feeds." },
          { type: "list", items: ["Multi-camera grid", "YOLOv8 detection", "Analytics dashboard"] },
        ],
      },
    ]);
  });

  it("returns nothing for a README without case-study sections", () => {
    expect(parseCaseStudy("# Project\n\n## Installation\n\nRun it.")).toEqual([]);
  });

  it("truncates very long text", () => {
    const sections = parseCaseStudy(`## Problem\n${"word ".repeat(120)}`);
    const block = sections[0].blocks[0];
    expect(block.type === "p" && block.text.endsWith("…")).toBe(true);
    expect(block.type === "p" && block.text.length).toBeLessThanOrEqual(261);
  });
});

describe("summarizeReadme", () => {
  it("uses the intro paragraph under the title, skipping badges", () => {
    const readme = `# EcoCoin\n\n[![CI](https://x/badge.svg)](https://x)\n\nA blockchain tourism booking platform with **secure** payments.\n\n## Installation\n\nnpm i`;
    expect(summarizeReadme(readme)).toBe("A blockchain tourism booking platform with secure payments.");
  });

  it("prefers an Overview section", () => {
    const readme = `# Tool\n\nShort tagline here.\n\n## Overview\n\nA dashboard that forecasts retail demand from sales history.`;
    expect(summarizeReadme(readme)).toBe("A dashboard that forecasts retail demand from sales history.");
  });

  it("ends on a sentence when the paragraph is long", () => {
    const readme = `# X\n\nThis project detects anomalies in industrial sensor data in real time. ${"It also does a lot more. ".repeat(10)}`;
    expect(summarizeReadme(readme)).toBe(
      `This project detects anomalies in industrial sensor data in real time.${" It also does a lot more.".repeat(4)}`,
    );
  });

  it("returns null when there is nothing descriptive", () => {
    expect(summarizeReadme("# Project\n\n## Installation\n\nRun the installer with npm.")).toBeNull();
  });
});
