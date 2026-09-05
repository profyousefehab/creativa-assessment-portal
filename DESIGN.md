---
version: 1.0.0
name: Creativa Design System
description: |
  The single source of truth design system for Creativa Innovation Hubs Certificate Studio — an enterprise-grade certificate generation, attendance tracking, template editor, and automated email delivery desktop application. Characterized by high-contrast paper-white cards with crisp 1px hairlines, signature Creativa Royal Blue (#004e9e), warm Gold highlights (#f8af43), geometric full-pill interactive components, and precise dual-font hierarchy (Bricolage Grotesque for app display & Futura Cyrillic for certificate generation).

colors:
  primary: "#004e9e"
  primary-dark: "#003b78"
  primary-light: "#e6eff8"
  accent-gold: "#f8af43"
  accent-gold-dark: "#e59d30"
  accent-gold-light: "#fef3e2"
  on-primary: "#ffffff"
  on-gold: "#222222"
  ink: "#004e9e"
  ink-deep: "#003b78"
  charcoal: "#222222"
  body: "#616161"
  mute: "#9e9e9e"
  canvas: "#ffffff"
  surface-soft: "#fafafa"
  surface-card: "#ffffff"
  surface-dark: "#004e9e"
  surface-dark-deep: "#003b78"
  hairline: "#e5e5e5"
  hairline-strong: "#d4d4d4"
  hairline-dark: "#003b78"
  focus-ring: "rgba(0, 78, 158, 0.20)"
  success: "#10b981"
  success-soft: "#ecfdf5"
  success-border: "#a7f3d0"
  success-text: "#047857"
  warning: "#f59e0b"
  warning-soft: "#fffbeb"
  warning-border: "#fde68a"
  warning-text: "#b45309"
  error: "#ef4444"
  error-soft: "#fef2f2"
  error-border: "#fecaca"
  error-text: "#b91c1c"

typography:
  display-xl:
    fontFamily: "Bricolage Grotesque"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.02em
  display-lg:
    fontFamily: "Bricolage Grotesque"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.015em
  heading-lg:
    fontFamily: "Bricolage Grotesque"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
  heading-md:
    fontFamily: "Bricolage Grotesque"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.005em
  heading-sm:
    fontFamily: "Bricolage Grotesque"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body-lg:
    fontFamily: "Bricolage Grotesque"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-md:
    fontFamily: "Bricolage Grotesque"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "Bricolage Grotesque"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  caption-xs:
    fontFamily: "Bricolage Grotesque"
    fontSize: 10px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.02em
  code-md:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  code-sm:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  certificate-display:
    fontFamily: "Futura Cyrillic"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.05em
  certificate-name:
    fontFamily: "Futura Cyrillic"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.04em
  certificate-body:
    fontFamily: "Futura Cyrillic"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.02em

rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  2xl: 20px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 20px
  xl: 24px
  2xl: 32px
  3xl: 48px
  4xl: 64px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: "8px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: "8px 20px"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "8px 20px"
  button-accent:
    backgroundColor: "{colors.accent-gold}"
    textColor: "{colors.on-gold}"
    rounded: "{rounded.full}"
    padding: "8px 20px"
  button-danger:
    backgroundColor: "{colors.error-soft}"
    textColor: "{colors.error-text}"
    rounded: "{rounded.full}"
    padding: "8px 20px"
  input-pill:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  card-paper:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "20px"
  card-inverted:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    padding: "20px"
  nav-pill-container:
    backgroundColor: "{colors.surface-soft}"
    rounded: "{rounded.full}"
    padding: "4px"
  nav-pill-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: "6px 16px"
  nav-pill-inactive:
    backgroundColor: "transparent"
    textColor: "{colors.body}"
    rounded: "{rounded.full}"
    padding: "6px 16px"
  badge-pill:
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Creativa Design System

> **Single Source of Truth** for the Creativa Innovation Hubs Certificate Studio desktop & web platform.
> Designed for high operational velocity, absolute clarity in bulk processing, and strict alignment with Creativa brand identity.

---

## Overview

Creativa Certificate Studio is a mission-critical utility used to configure certificate templates, process multi-sheet attendance logs, verify eligibility thresholds, generate high-resolution print-ready PDFs, and dispatch customized email certificates.

### Brand Personality & Emotional Tone
- **Institutional & Authoritative:** Grounded in Creativa's signature Royal Blue (`#004e9e`) and Egyptian digital innovation mandate.
- **Precision-Engineered:** High visual density without clutter; clean flat paper cards with crisp 1px hairline borders (`#e5e5e5`).
- **Tactile & Responsive:** All interactive controls use geometric full-pill contours (`rounded-full` / `9999px`), subtle state transitions (`0.15s ease`), and immediate visual feedback.
- **Dual-Domain Typography:** Systematic separation between UI typography (**Bricolage Grotesque**) and official credential document typography (**Futura Cyrillic**).

---

## Colors

The color system avoids arbitrary gradients and relies on structured, high-contrast semantic palettes.

### 1. Brand Core
| Token | Hex / Value | Semantic Role |
|---|---|---|
| `primary` | `#004e9e` | Creativa Royal Blue — Navigation headers, primary CTA buttons, active tabs, brand accents |
| `primary-dark` | `#003b78` | Deep Blue — Primary button hover/active states, inverted card borders |
| `primary-light` | `#e6eff8` | Pale Blue Tint — Selection backgrounds, tag backgrounds, active hover highlights |
| `accent-gold` | `#f8af43` | Creativa Gold — High-visibility accents, dark-surface CTA buttons, eligible attendance badges |
| `accent-gold-dark` | `#e59d30` | Warm Amber Gold — Hover state for gold accent buttons |
| `accent-gold-light` | `#fef3e2` | Warm Gold Tint — Notification and warning callout backgrounds |

### 2. Canvas & Surfaces
| Token | Hex / Value | Semantic Role |
|---|---|---|
| `canvas` | `#ffffff` | Pure white background canvas and modal interiors |
| `surface-soft` | `#fafafa` | Neutral soft gray for main application workbench, tab containers, and canvas backdrops |
| `surface-card` | `#ffffff` | Elevated paper card surface enclosed with 1px hairline border |
| `surface-dark` | `#004e9e` | Inverted hero cards, dark stats dashboard surfaces, and summary panels |
| `surface-dark-deep` | `#003b78` | Darker tier for stats cards, hover headers on dark surfaces |

### 3. Typography & Neutrals
| Token | Hex / Value | Semantic Role |
|---|---|---|
| `charcoal` | `#222222` | Dominant text color for headings, form labels, and high-emphasis body |
| `body` | `#616161` | Secondary descriptions, subheadings, helper text, and secondary icon fills |
| `mute` | `#9e9e9e` | Placeholder text, disabled inputs, timestamp captions, subtle separators |
| `hairline` | `#e5e5e5` | Standard structural border for all cards, panels, inputs, and dividers |
| `hairline-strong` | `#d4d4d4` | Emphasized dividers, scrollbar thumbs, and active drop borders |

### 4. Semantic Status Indicators
| State | Badge BG | Border | Text | Purpose |
|---|---|---|---|---|
| **Success / Eligible** | `#ecfdf5` | `#a7f3d0` | `#047857` | Attendance qualified (>=70%), verified students, email sent |
| **Warning / Review** | `#fffbeb` | `#fde68a` | `#b45309` | Irregular attendance, missing email warnings, uncommitted edits |
| **Error / Ineligible** | `#fef2f2` | `#fecaca` | `#b91c1c` | Disqualified attendance (<70%), bounced emails, parsing errors |
| **Info / Sync** | `#e6eff8` | `#bfdbfe` | `#004e9e` | Real-time cloud sync, preset active, active generation queue |

---

## Typography

The typography architecture uses a strict two-family separation.

```
┌───────────────────────────────────────────────────────────┐
│                     TYPOGRAPHY MATRIX                     │
├─────────────────────────────┬─────────────────────────────┤
│      APP UI INTERFACE       │    CERTIFICATE DOCUMENTS    │
│    'Bricolage Grotesque'    │      'Futura Cyrillic'      │
│  (Modern Geometric Sans)    │ (Formal Credential Serif/Sans│
└─────────────────────────────┴─────────────────────────────┘
```

### Font Families
1. **Application UI (`Bricolage Grotesque`):** Used across the whole desktop shell, buttons, navigation pills, inspector panels, and data tables.
2. **Certificate Documents (`Futura Cyrillic`):** Loaded via local font-face declarations in 7 weights (Light 300, Book 400, Medium 500, Demi 600, Bold 700, ExtraBold 800, Heavy 900). Reserved exclusively for canvas overlays and output PDF rendering.
3. **Numerics & Code (`ui-monospace`):** Used for student counts, percentages, coordinates (X, Y, W, H), RGB hex codes, and payload logs.

### Type Scale (Application UI)
- `display-xl` (32px / 700 / -0.02em): Top-level splash & setup headlines.
- `display-lg` (24px / 700 / -0.015em): Main workspace view headers.
- `heading-lg` (20px / 600 / -0.01em): Section titles, modal titles.
- `heading-md` (16px / 600 / -0.005em): Card headers, tool section groupings.
- `heading-sm` (14px / 600): Sub-group headers, table column headers.
- `body-lg` (16px / 400): Intro paragraphs and long-form helper prompts.
- `body-md` (14px / 400): Default body text, form input values, action labels.
- `body-sm` (12px / 400): Dense table rows, helper notes, inspector tooltips.
- `caption-xs` (10px / 500 / 0.02em): Mono tags, status pills, version badges.
- `code-md` (13px / 500): Coordinate inputs, email variables (`{{name}}`).
- `code-sm` (11px / 500): Batch progress counters, hex color values.

---

## Layout

The studio operates as a fixed-viewport desktop workstation (`h-screen w-screen overflow-hidden`) with modular workspaces.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Top Navigation Bar (56px) — Logo | Pill Tab Bar | Team Sync Status      │
├──────────────────────────────────────────────────────────────────────────┤
│ Main Workspace Area (flex-1 overflow-hidden bg-[#fafafa])                │
│                                                                          │
│  ┌───────────────────────────────┬──────────────────────────────────┐    │
│  │ Primary Stage / Canvas        │ Side Inspector / Action Panel    │    │
│  │ (flex-1 flex items-center)    │ (w-80 or w-96 border-l bg-white) │    │
│  │                               │                                  │    │
│  └───────────────────────────────┴──────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────────────┤
│ Developer Signature (Fixed bottom-2 right-4)                             │
└──────────────────────────────────────────────────────────────────────────┘
```

### Spacing & Grid Rules
- **Spacing Scale:** Standard 4px base multiplier: `xs: 4px`, `sm: 8px`, `md: 12px`, `base: 16px`, `lg: 20px`, `xl: 24px`, `2xl: 32px`.
- **Panel Containment:** All content areas sit on `#fafafa` canvas with cards wrapped in `.paper-card` (`#ffffff` + `1px #e5e5e5`).
- **Scroll Behavior:** Main viewport is locked (`overflow-hidden`); sub-panels manage their own sleek 6px scrollbars (`::-webkit-scrollbar`).

---

## Elevation & Depth

Creativa Certificate Studio uses a **clean flat paper aesthetic**. Traditional heavy drop shadows are intentionally omitted in favor of clear tonal layers and 1px hairlines.

- **Flat Paper Cards:** `border: 1px solid #e5e5e5; background: #ffffff; border-radius: 12px;`
- **Dark Inverted Cards:** `border: 1px solid #003b78; background: #004e9e; color: #ffffff; border-radius: 12px;`
- **Soft Interactive Depressed Wells:** `background: #fafafa; border: 1px solid #e5e5e5;`
- **Focus Rings:** `box-shadow: 0 0 0 2px rgba(0, 78, 158, 0.20);`
- **Modals & Overlays:** Soft backdrop blur (`backdrop-blur-sm bg-black/40`) with crisp `rounded-2xl` modal bodies.

---

## Shapes

Geometry is strictly controlled across two primary primitives:

1. **Full Pills (`rounded-full` / `9999px`):**
   - Navigation tab buttons
   - Primary, Secondary, and Accent CTA buttons
   - Input text pills and search bars
   - Status tags, attendance counters, and user badges
   - Scrollbar thumbs
2. **Rounded Containers (`rounded-xl` / `12px` & `rounded-2xl` / `16px`):**
   - Data cards (`.paper-card`)
   - Stage canvas bounding boxes
   - Modal containers and dialog popups
   - File drag-and-drop dropzones

---

## Components

### 1. Pill Buttons
- **Primary Pill (`.btn-pill-primary`):**
  - Background: `#004e9e` | Text: `#ffffff` | Radius: `9999px` | Padding: `8px 20px`
  - Hover: `#003b78` | Active: `#002d5c`
- **Secondary Pill (`.btn-pill-secondary`):**
  - Background: `#ffffff` | Border: `1px solid #e5e5e5` | Text: `#004e9e`
  - Hover: Background `#fafafa`, Border `#004e9e`
- **Accent On-Dark Pill (`.btn-pill-on-dark`):**
  - Background: `#f8af43` | Text: `#222222` | Font Weight: `600`
  - Hover: `#e59d30`
- **Danger Pill:**
  - Background: `#fef2f2` | Border: `1px solid #fecaca` | Text: `#b91c1c`
  - Hover: `#fee2e2`

### 2. Pill Inputs & Selects (`.input-pill`)
- Background: `#ffffff` | Text: `#222222` | Border: `1px solid #e5e5e5` | Radius: `9999px`
- Padding: `8px 16px` | Font Size: `14px`
- Focus: `border-color: #004e9e; box-shadow: 0 0 0 2px rgba(0, 78, 158, 0.15); outline: none;`

### 3. Navigation Bar & Tabs
- Top bar height: `56px` | Background: `#ffffff` | Bottom border: `1px solid #e5e5e5`
- Pill Tab Container: `#fafafa` background with `p-1 rounded-full border border-[#e5e5e5]`
- Active Tab: `bg-[#004e9e] text-white font-medium shadow-none`
- Inactive Tab: `text-[#616161] hover:text-[#004e9e] hover:bg-white`

### 4. File Drop Zones
- Border: `2px dashed #d4d4d4` | Background: `#fafafa` | Radius: `12px`
- Drag Active: `border-[#004e9e] bg-[#e6eff8]/50`

### 5. Tables & Data Grids
- Container: `border border-[#e5e5e5] rounded-xl overflow-hidden bg-white`
- Header: `#fafafa` background with `text-xs font-semibold text-[#616161] uppercase tracking-wider`
- Row: `border-b border-[#e5e5e5] hover:bg-[#fafafa]/80 transition-colors`
- Numbers/Counters: `font-mono text-xs font-medium`

---

## Do's and Don'ts

### Do's
- ✅ **DO** use `rounded-full` for all buttons, inputs, tabs, search bars, and status tags.
- ✅ **DO** maintain high contrast with pure white card surfaces on `#fafafa` workspace background.
- ✅ **DO** use `#004e9e` (Creativa Blue) as the primary brand anchor and `#f8af43` (Gold) for high-impact callouts.
- ✅ **DO** format certificate document text exclusively with `Futura Cyrillic` and application UI with `Bricolage Grotesque`.
- ✅ **DO** display numeric metrics, counts, and coordinates with monospace styling (`font-mono`).
- ✅ **DO** keep cards flat with 1px `#e5e5e5` hairlines instead of heavy elevation drop shadows.

### Don'ts
- ❌ **DON'T** use purple or arbitrary generic colors (Strictly follow Creativa Brand Blue `#004e9e` & Gold `#f8af43`).
- ❌ **DON'T** mix sharp corner rectangles with pills in navigation or action buttons.
- ❌ **DON'T** use `Futura Cyrillic` for UI controls, form labels, or tables (use `Bricolage Grotesque`).
- ❌ **DON'T** apply multi-stop neon gradients or skeuomorphic shadows.
- ❌ **DON'T** hardcode arbitrary hex colors in components when design tokens are available.
- ❌ **DON'T** hide keyboard focus indicators (`focus:outline-none` must be accompanied by `focus:ring-2 focus:ring-[#004e9e]/20`).
