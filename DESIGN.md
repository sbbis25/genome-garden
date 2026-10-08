---
name: Genome Garden
description: A quiet light instrument panel around a living colony; the colony is the only colour on screen.
colors:
  paper: "#f3f2f7"
  raised: "#fbfbfd"
  wash: "#e9e8f0"
  wash-deep: "#dfdee9"
  line: "#dedde8"
  line-strong: "#cbcad8"
  ink: "#1b1a24"
  ink-2: "#4b4a5a"
  ink-3: "#666575"
  hematoxylin: "#4b4396"
  hematoxylin-soft: "#e7e4f5"
  amber: "#7a4f00"
  amber-soft: "#f6e8c6"
  danger: "#b3263e"
  danger-soft: "#fbe6ea"
  dye-sage: "#6f9f78"
  dye-straw: "#c9a85c"
  dye-clay: "#b9745a"
  dye-slate: "#7088bb"
typography:
  brand:
    fontFamily: "Chivo, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 780
    lineHeight: 1.45
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Chivo, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 700
    lineHeight: 1.45
  body:
    fontFamily: "Chivo, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  control:
    fontFamily: "Chivo, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 520
    lineHeight: 1.45
  help:
    fontFamily: "Chivo, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Chivo, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.3
  number:
    fontFamily: "Chivo Mono, ui-monospace, monospace"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.15
    fontFeature: "tabular-nums"
  dna:
    fontFamily: "Chivo Mono, ui-monospace, monospace"
    fontSize: "12.5px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0.03em"
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "20px"
  column-gap: "28px"
components:
  button:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 13px"
    height: "34px"
  button-hover:
    backgroundColor: "{colors.wash-deep}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "6px 13px"
    height: "34px"
  option-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    height: "36px"
  tool-pill:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "4px"
  hint-pill:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "9px 18px"
  world-matte:
    backgroundColor: "{colors.wash}"
    rounded: "{rounded.lg}"
  code-block:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px 14px"
  hook-on:
    backgroundColor: "{colors.hematoxylin-soft}"
    textColor: "{colors.hematoxylin}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  badge-override:
    backgroundColor: "{colors.amber-soft}"
    textColor: "{colors.amber}"
    rounded: "{rounded.xs}"
    padding: "1px 8px"
  banner-error:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    padding: "9px 20px"
  banner-warn:
    backgroundColor: "{colors.amber-soft}"
    textColor: "{colors.amber}"
    padding: "9px 20px"
---

# Design System: Genome Garden

## Overview

**Creative North Star: "The Specimen Slide"**

The page is cool violet-tinted paper with near-black ink, and the colony is the only colour on it. Every control around the world is a calm, tone-on-tone instrument that recedes: flat, unboxed regions separated by space and hairlines, never by bordered cards. The one chromatic voice outside the colony is a deep hematoxylin violet, kept for selection, focus and the pinned creature. The name comes from the stain on a microscope slide: a quiet field in which one dyed thing is meant to be read first.

Creatures and ground are soft natural dyes (sage, straw, clay, slate) interpolated along one ramp in `app.js`. The ground is the same ramp mixed 58% toward paper, so the colony visibly drifts toward or away from its background. Density is laptop-and-projector comfortable: 14px body, generous 14px to 28px gaps, a floor of 12px text.

Motion is smooth and short: one easing curve, three durations, and state changes that slide or fade rather than snap.

**Key Characteristics:**
- Colour belongs to the colony; the interface is ink, paper and one violet.
- Space and hairlines do the separating; there are no boxed card grids.
- Selected state is an ink fill with paper text, never a weight change.
- Depth appears only on floating pieces over the world.
- Chivo for words, Chivo Mono for numbers and DNA letters, both self-hosted.

## Colors

A violet-cast neutral field with one hematoxylin accent, two tinted status pairs, and a four-dye ramp that exists only inside the colony.

### Primary
- **Hematoxylin Violet** (`#4b4396`): selection, focus and pinned state only. Focus outlines (2px, 2px offset), slider fill and thumb ring, switch-on track, gene bars, the pinned-creature ring on the canvas, the "pinned" tag, the active hook pill's text, the "creatures" chart line, `::selection` tint.
- **Hematoxylin Mist** (`#e7e4f5`): the soft partner for the accent: pinned tag and active-hook pill fills, text selection.

### Secondary
- **Amber Ink** (`#7a4f00`) on **Amber Wash** (`#f6e8c6`): "a code hook overrides this control" badges and the restart-needed banner (banner text uses a darker `#4d3300`).
- **Signal Red** (`#b3263e`) on **Rose Wash** (`#fbe6ea`): errors, the unread-error dot on the Code tab, broken hook pills, the destructive hover, offline and error banners (banner text `#5e1422`). The predator mark on the canvas uses a lighter `#c0394f`.

### Tertiary
- **Natural-dye ramp** (sage `#6f9f78`, straw `#c9a85c`, clay `#b9745a`, slate `#7088bb`): stops at body hue 0, 0.33, 0.66 and 1, interpolated linearly. Creature bodies are the ramp mixed 10% toward ink; the ground is the ramp mixed 58% toward paper. The hue slider track and hue histogram use the raw ramp. These values live in `app.js`, not CSS.
- **Chart dyes**: trait lines use speed `#6a82b5`, size `#8c76ad`, sense `#b8914a`, hue `#b4694f`, efficiency `#5f9170`; food in the population chart is straw-gold `#b8914a`. DNA bases are tinted text: A `#3c7a52`, C `#4a6498`, G `#8f6a1c`, T `#a8445a`.

### Neutral
- **Cool Paper** (`#f3f2f7`): the page.
- **Raised Paper** (`#fbfbfd`): floating pills, toasts, slider thumbs, switch knobs.
- **Wash** (`#e9e8f0`) and **Deep Wash** (`#dfdee9`): resting and hover fills for buttons, unselected options, code blocks, and the world matte.
- **Hairline** (`#dedde8`) and **Strong Hairline** (`#cbcad8`): dividers, tab rule, slider unfilled track, switch-off track, scrollbar thumb.
- **Ink** (`#1b1a24`), **Ink 2** (`#4b4a5a`), **Ink 3** (`#666575`): primary text and selected fills; secondary text and idle controls; help text, labels, inactive tabs.

### Named Rules
**The Colony-Only Colour Rule.** Outside the colony and its charts, the only chroma on screen is hematoxylin violet and the amber and red status tints. Any new hue in the chrome must be justified as a status, not decoration.
**The Rare Violet Rule.** Hematoxylin marks selection, focus or the pinned creature. It is never a button fill, heading colour, or background.
**The Dye Mixing Rule.** Colony and ground colours are derived by mixing the dye ramp with paper or ink, not by picking fresh hexes.

## Typography

**UI Font:** Chivo (variable, 100 to 900; falls back to system-ui)
**Mono Font:** Chivo Mono (variable; falls back to ui-monospace) for DNA letters, counts, values and code
Both are self-hosted from `garden/web/fonts` as woff2 (OFL licences alongside); no network fonts.

**Character:** Chivo is a sturdy, slightly grotesque sans with real weight range, so hierarchy comes from weight and size inside one family. Its mono sibling keeps numbers and sequence letters visibly "data" without a second personality.

### Hierarchy
- **Brand** (780, 18px, -0.01em): the wordmark only. The "wider window" heading is 20px/760 on the same tracking.
- **Title** (700, 15.5px): accordion group heads and the creature card heading; preset names are 15px/700, section and chart headings 14px/700.
- **Body** (400, 14px, 1.45): base text; control labels are 480, buttons 520 to 600.
- **Help** (400, 12.5px, ink-3, 1.45): control help and facts under sliders; hint and caption text are 13 to 13.5px.
- **Label** (400 to 520, 12px, ink-3): stat captions, legend, chart legend, badges (600).
- **Number** (Chivo Mono 500, 14 to 16px, tabular-nums): creature and generation counts, tiles, facts, slider values (12.5px).
- **DNA** (Chivo Mono 500, 12.5px, 0.03em): base letters; code blocks are 12.5px/1.55.

### Named Rules
**The Twelve Floor Rule.** No text under 12px.
**The Weight Is Rank Rule.** Weight separates headings from body. Selected and hover states change colour or fill, never font weight.
**The Mono Means Data Rule.** Chivo Mono is for numbers, DNA letters, code and hook names. Words stay in Chivo.

## Layout

A three-column grid under a 60px top bar: controls 292px, world flexible (`minmax(0, 1fr)`), creature-and-charts column 344px. Columns are separated by 28px of padding on the centre and right columns, with no rules or boxes between them. Page padding is 6px 20px 20px. Simple view collapses the right column to 0 with a fade and a 420ms grid-template transition; Full view opens it and reveals the per-gene histogram row under the caption (auto-fit, 104px minimum, 18px gap).

Spacing rhythm is small and practical: 6px (button gaps), 8 to 10px (bar and row gaps), 14px (column and region gap), 18px (between controls), 20px (page edge), 28px (column gap), 26px between right-column sections.

Responsive ladder (all `max-width`):
- 1400px: columns tighten to 264px / flexible / 290px, column padding 20px, page padding 14px, speed buttons trim, the "achieved speed" readout hides, preset select narrows to 112px.
- 1180px: the right column is removed entirely; two columns remain.
- 1039px: the preset select hides.
- 930px: the generations counter hides.
- 899px: the app is replaced by a centred "needs a wider window" note.

The top bar fits by trimming sizes first and hiding controls last.

## Elevation & Depth

Flat by default. Regions are separated by space, hairlines and tonal washes, not shadows. Depth exists only on pieces that float over the world.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 1px 2px rgba(27, 26, 36, 0.08), 0 4px 14px rgba(27, 26, 36, 0.07)`): tool pill, hint pill, legend pill, toasts, the "Paused" pill. A soft offset-and-blur, ink-tinted, never hard-edged.
- **Thumb** (`0 1px 3px rgba(27, 26, 36, 0.25)`): slider thumbs; switch knobs use `0 1px 2px rgba(27, 26, 36, 0.3)`.

### Named Rules
**The Floating-Only Rule.** Only elements that sit over the world get the Float shadow. Panels, columns, groups and charts stay flat.

## Shapes

Soft but not bubbly. Radii: 4px (inline code, override badge), 8px (buttons, options, code blocks), 10 to 12px (speed group, toasts, tool pill, error blocks), 16px (the world matte), full pill (hints, legend, hook pills, tags). The canvas inside the matte is 12px. Controls have no borders; fills and the 2px focus ring define them. Hairlines are 1px bottom rules only (tabs, accordion groups, presets, panel foot). Sliders are 4px tracks (6px for the hue ramp), thumbs 16px circles with a 2px accent ring; switches are 38x22 pills with a 16px knob. The scrolling control panel fades out over its last 56px instead of ending in a hard edge.

## Components

### Buttons
- **Shape:** gently curved (8px), 34px minimum height, 6px 13px padding, no border.
- **Default:** Wash fill, ink text, weight 520. Hover goes to Deep Wash; press scales to 0.98 over 140ms.
- **Primary:** Ink fill, paper text, weight 600 ("Show the science", "Restart world" in the restart banner). Hover lifts to `#2e2d3d`.
- **Danger action:** same as default; hover turns Rose Wash with Signal Red text.
- **Select:** a default button with a custom ink-3 chevron drawn in CSS gradients.

### Selected pills (options, tools, speed)
Unselected is Wash with ink-2 text; selected is an ink fill with paper text. Two-up option grids (36px high, 6px gap) and the tool pill (32px buttons inside a raised pill) swap fill in 140ms.

### Speed control
A Wash capsule (10px radius, 3px inset) holding six buttons. One ink pill slides behind the pressed button, implemented as a `::before` clipped with `clip-path: inset()` driven by `--ix` and `--iw` measured in JS, 420ms on the house ease. Text colour changes ink-2 to paper in 240ms. Placement is skipped while hidden and snapped (`.still`) when motion is reduced.

### Tabs
Tune, Code, Scenarios as equal-width text buttons on a hairline. Inactive is ink-3, active is ink with the same weight. A 2px ink underline slides along the hairline via the same clip-path technique. A 7px Signal Red dot marks unread errors on Code. Arrow keys move between tabs and panels are wired with `aria-controls`. Panels enter with a 420ms 6px rise.

### Accordion groups
Bold 15.5px head with a CSS-drawn chevron (7px, rotates -45 to 45deg over 240ms), hairline between groups. Body opens by animating `grid-template-rows` 0fr to 1fr over 420ms while the inner content fades; hidden content is also `visibility: hidden`.

### Sliders, switches, badges
- **Slider:** 4px Strong Hairline track with an accent fill drawn by a gradient between `--a` and `--b` (supports a baseline origin); 16px raised thumb with 2px accent ring, scale 1.12 on hover. The hue slider uses the dye ramp as its track. A control flagged with `.pulse` loops a 2px accent outline (static under reduced motion).
- **Value readout:** Chivo Mono 12.5px, ink-2, right-aligned in a 44px slot.
- **Switch:** Strong Hairline track, accent when on, raised knob that slides 16px in 240ms.
- **Override badge:** Amber Ink on Amber Wash, 12px/600, 5px radius, shown under a control that Python code is overriding; that control dims to 45%.

### Banners
Full-bleed rows under the top bar (error: Rose Wash, restart-needed: Amber Wash, offline: Rose Wash). They open by animating `grid-template-rows` over 420ms with the row fading in after an 80ms delay. Inline `code` is Chivo Mono on a 7% ink tint; banner buttons are translucent ink tints, the primary one ink.

### Floating pills over the world
The tool pill (top-left), hint pill (top-centre, balanced wrap, fades and lifts 6px when dismissed), legend pill (bottom-right) and toasts (bottom-left, rise 8px in) are Raised Paper with the Float shadow. Pills ignore pointer events except the tool pill. The legend uses 9px dots.

### Creature card
Unboxed on the paper, heading with an accent "pinned" tag, four mono facts, then a two-column DNA grid. Each gene has name and value on one line, bases in Chivo Mono with the four tinted base colours, and a 3px accent bar (hue genes use their own dye). Swapping creature re-runs the 240ms rise.

### Histogram row, tiles and charts
Three small mono stat tiles and two line charts (110px high canvases) sit on the paper without borders, each with a 12px legend of 3px line swatches. The per-gene histogram row sits beneath the world caption: a 12.5px ink-3 title, 64px canvas, ink marker for the hovered creature. Bars use trait dyes or the hue ramp. Canvas gridlines are `#e1e0ea`, text `#666575`.

### The world
A Wash matte (16px radius) holds the canvas. Ground is a ramp-tinted mix toward paper; creatures are dye bodies with a thin ink outline; hover is a 70% ink ring and the pinned creature a hematoxylin ring with a dashed trail; predators are red with a faint dashed range. The caption beneath is one plain line: a bold ink "What's selecting" then ink-2 text.

## Do's and Don'ts

### Do:
- **Do** keep chrome ink and paper and let colour come from the colony; draw any new data colour from the dye ramp or the chart dye set.
- **Do** mark selection with an ink fill and paper text, and mark focus with the 2px hematoxylin outline.
- **Do** separate regions with 14 to 28px of space, a 1px Hairline, or a Wash fill.
- **Do** use the one easing `cubic-bezier(0.16, 1, 0.3, 1)` with 140ms (hover, press), 240ms (fades, toggles) and 420ms (slides, expands, panel changes).
- **Do** animate indicators by clipping a pre-drawn ink shape with measured offsets, and honour `prefers-reduced-motion` (the build clamps all durations to 0.01ms).
- **Do** set numbers, DNA letters and code in Chivo Mono with tabular numerals.
- **Do** keep text at 12px or larger, with ink-3 (`#666575`) as the lightest text on paper.

### Don't:
- **Don't** introduce teal, neon or any second accent; the dark-dashboard-with-glowing-accent look is the thing this system refuses.
- **Don't** build grids of bordered cards or wrap regions in outlined boxes. `.card` is a plain unboxed container.
- **Don't** use tracked, uppercase small-caps labels; labels are sentence case at 12px.
- **Don't** change font weight to show selected, hover or active state.
- **Don't** apply the Float shadow to anything that does not float over the world, and don't use hard-edged or offset-only shadows.
- **Don't** fill a button or heading with hematoxylin; it stays on selection, focus and the pinned creature.
- **Don't** load network fonts or swap in a system face for display text.
- **Don't** colour the ground or creatures with a fresh hex; mix the ramp with paper or ink.

## Drift noted, not canonized

Hard-coded hexes outside the tokens are carried by the build: legend dots in `index.html` (`#6a6975`, `#c0394f`), banner text colours (`#5e1422`, `#4d3300`), primary hover `#2e2d3d`, base-letter colours, and canvas colours in `app.js`. Treat them as local values, not new tokens. The design contract mentions a 316px side column; the shipped columns are 292px left and 344px right (264px and 290px at 1400px and below).
