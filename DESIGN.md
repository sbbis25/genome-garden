---
name: Genome Garden
description: A quiet instrument panel, in light paper or deep violet night, around a living colony; the colony is the only colour on screen.
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
  night-paper: "#131219"
  night-raised: "#1d1c27"
  night-wash: "#24232f"
  night-wash-deep: "#2d2c3a"
  night-line: "#2b2a37"
  night-line-strong: "#3b3a4a"
  night-ink: "#eceaf4"
  night-ink-2: "#bdbccb"
  night-ink-3: "#9a99ac"
  night-hematoxylin: "#a79df0"
  night-hematoxylin-soft: "#2b2850"
  night-amber: "#e2b866"
  night-amber-soft: "#3a2f14"
  night-danger: "#ff8d9e"
  night-danger-soft: "#3d1a23"
  mask-opaque: "#000000"
typography:
  brand:
    fontFamily: "Chivo, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 780
    lineHeight: 1.45
    letterSpacing: "-0.01em"
  notice:
    fontFamily: "Chivo, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 760
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
  hair: "2px"
  ramp: "3px"
  xs: "4px"
  tag: "5px"
  key: "6px"
  inset: "7px"
  sm: "8px"
  group: "10px"
  knob: "11px"
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
  button-primary-night:
    backgroundColor: "{colors.night-ink}"
    textColor: "{colors.night-paper}"
    rounded: "{rounded.sm}"
    padding: "6px 13px"
    height: "34px"
  scenario-run-night:
    backgroundColor: "{colors.night-hematoxylin-soft}"
    textColor: "{colors.night-hematoxylin}"
    rounded: "{rounded.sm}"
    padding: "6px 13px"
    height: "34px"
  option-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    height: "36px"
  option-selected-night:
    backgroundColor: "{colors.night-ink}"
    textColor: "{colors.night-paper}"
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
    rounded: "{rounded.group}"
    padding: "12px 14px"
  hook-on:
    backgroundColor: "{colors.hematoxylin-soft}"
    textColor: "{colors.hematoxylin}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  badge-override:
    backgroundColor: "{colors.amber-soft}"
    textColor: "{colors.amber}"
    rounded: "{rounded.tag}"
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

The page is a quiet field with one dyed thing on it. In the light theme that field is cool violet-tinted paper with near-black ink; in the dark theme it is the same world at night, a deep violet-tinted near-black with pale ink. Either way the colony is the only colour on it. Every control around the world is a calm, tone-on-tone instrument that recedes: flat, unboxed regions separated by space and hairlines, never by bordered cards. The one chromatic voice outside the colony is a hematoxylin violet (deep in light, a lighter lavender in dark), kept for selection, focus and the pinned creature. The name comes from the stain on a microscope slide.

Dark is a second mode of one identity, not a second identity. Every colour in the interface, the canvas and the charts lives in a CSS custom property on `:root`, with a second value under `:root[data-theme="dark"]`; `app.js` reads them (`readTheme()`) so the DOM, the world and the charts share one source and the themes cannot drift apart. Creatures and ground are soft natural dyes (sage, straw, clay, slate) interpolated along one ramp in `app.js` and mixed toward theme-owned base colours.

Density is laptop-and-projector comfortable: 14px body, generous 14px to 28px gaps, a floor of 12px text. Motion is smooth and short: one easing curve, three durations, and state changes that slide or fade rather than snap.

**Key Characteristics:**
- Colour belongs to the colony; the interface is ink, paper and one violet, in both themes.
- Space and hairlines do the separating; there are no boxed card grids.
- Selected state is a fill through the ink token with paper-token text: dark fill on light, light fill on dark. Never a weight change.
- Depth appears only on floating pieces over the world.
- Chivo for words, Chivo Mono for numbers and DNA letters, both self-hosted.
- One token set, two values each; nothing is hard-coded in CSS or JS.

## Colors

A violet-cast neutral field with one hematoxylin accent, two tinted status pairs, and a four-dye ramp that exists only inside the colony. The frontmatter holds the light values under their original names and the dark values under `night-` names; the CSS names are `--paper`, `--raised`, `--wash`, `--wash-2`, `--line`, `--line-2`, `--ink`, `--ink-2`, `--ink-3`, `--accent`, `--accent-soft`, `--amber`, `--amber-soft`, `--danger`, `--danger-soft`.

### Primary
- **Hematoxylin Violet** (`--accent`, light `#4b4396`, dark `#a79df0`): selection, focus and pinned state only. Focus outlines (2px, 2px offset), slider fill and thumb ring, switch-on track, gene bars, the pinned-creature ring on the canvas, the "pinned" tag, the active hook pill's text, the "creatures" chart line (`--series-pop`), `::selection` tint.
- **Hematoxylin Mist** (`--accent-soft`, light `#e7e4f5`, dark `#2b2850`): the soft partner: pinned tag and active-hook pill fills, text selection, and in dark the scenario run button fill.

### Secondary
- **Amber Ink** (`--amber`, light `#7a4f00`, dark `#e2b866`) on **Amber Wash** (`--amber-soft`, light `#f6e8c6`, dark `#3a2f14`): "a code hook overrides this control" badges and the restart-needed banner. Banner text is `--amber-ink` (light `#4d3300`, dark `#ffe3ad`).
- **Signal Red** (`--danger`, light `#b3263e`, dark `#ff8d9e`) on **Rose Wash** (`--danger-soft`, light `#fbe6ea`, dark `#3d1a23`): errors, the unread-error dot on the Code tab, broken hook pills, the destructive hover, offline and error banners. Banner text is `--danger-ink` (light `#5e1422`, dark `#ffd5db`).

### Tertiary
- **Natural-dye ramp** (sage `#6f9f78`, straw `#c9a85c`, clay `#b9745a`, slate `#7088bb`): stops at body hue 0, 0.33, 0.66 and 1, interpolated linearly. The ramp itself is theme-independent and lives in `app.js` (`STOPS`); the theme only changes what it is mixed toward. The hue slider track and swatch use the raw ramp. The hue histogram bars and hue gene bar use `lifted()`, the ramp mixed `--ramp-lift` toward white (0 in light, 0.22 in dark).
- **Chart and trait tokens** (light / dark): `--trait-speed` `#6a82b5` / `#8fa6d8`, `--trait-size` `#8c76ad` / `#aa95cc`, `--trait-sense` `#b8914a` / `#d1ac66`, `--trait-hue` `#b4694f` / `#d38a6f`, `--trait-efficiency` `#5f9170` / `#7fb895`; `--series-food` `#b8914a` / `#d1ac66`. Custom-chart series cycle `--extra-1..6`: `#b0657f #4f93a3 #a38a3f #7d73b0 #7d9a55 #b87b5c` in light, `#d283a0 #6fb5c4 #c4aa5f #9a90cf #9cba76 #d49a7c` in dark.
- **DNA bases** (`--letter-a/c/g/t`): light `#3c7a52 #4a6498 #8f6a1c #a8445a`, dark `#7bbb93 #8ea6d6 #d1ac5c #e07b92`.

### Neutral
- **Paper** (`--paper`, light `#f3f2f7`, dark `#131219`): the page, and the `theme-color` meta.
- **Raised** (`--raised`, light `#fbfbfd`, dark `#1d1c27`): floating pills, toasts, slider thumbs, switch knobs.
- **Wash** (`--wash`, light `#e9e8f0`, dark `#24232f`) and **Deep Wash** (`--wash-2`, light `#dfdee9`, dark `#2d2c3a`): resting and hover fills for buttons, unselected options, code blocks, and the world matte.
- **Hairline** (`--line`, light `#dedde8`, dark `#2b2a37`) and **Strong Hairline** (`--line-2`, light `#cbcad8`, dark `#3b3a4a`): dividers, tab rule, slider unfilled track, switch-off track, scrollbar thumb.
- **Ink** (`--ink`, light `#1b1a24`, dark `#eceaf4`), **Ink 2** (`--ink-2`, light `#4b4a5a`, dark `#bdbccb`), **Ink 3** (`--ink-3`, light `#666575`, dark `#9a99ac`): primary text and selected fills; secondary text and idle controls; help text, labels, inactive tabs.
- **Ink hover** (`--ink-hover`, light `#2e2d3d`, dark `#ffffff`): hover for ink-filled buttons.
- **Veils** (`--veil` 7% / 8%, `--veil-2` 8% / 10%, `--ring-soft` 15% / 18%): ink-tinted alphas (light) or white alphas (dark) for inline code, banner buttons and swatch rings. `--thumb-shadow` is 25% ink in light, 55% black in dark.
- **Alpha mask** (`#000`): used only as the opaque stop of the controls panel's bottom fade mask-image. It is never painted; it is not a palette colour.

### World tokens (canvas)
Read by `readTheme()`; light / dark.
- `--world-base` (RGB triplet) `243, 242, 247` / `36, 35, 47`: what the ground mixes toward. `--ground-amount` 0.58 / 0.78.
- `--body-tint` (RGB triplet) `27, 26, 36` / `36, 35, 47`: what bodies mix toward. `--body-amount` 0.1 / 0.4.
- `--grid` 5% ink / 5% white; `--food` 60% ink / 70% pale ink; `--sw-food` (legend dot) `#6a6975` / `#b9b8c8`.
- `--pred` `#c0394f` / `#e0566d`; `--pred-edge` `#5a1220` / `#240c13`; `--pred-ring` 22% / 50% of the predator red.
- `--creature-edge` 30% ink / 40% black; `--creature-nose` 55% ink / 55% black.
- `--hover-ring` 70% ink / 85% pale ink; `--sense-ring` 40% / 50% of the accent; pinned ring uses `--accent`.
- `--meteor` `#7a4f00` / `#e2b866`.
- `--axis-text` `#666575` / `#9a99ac`; `--axis-line` `#e1e0ea` / `#2f2e3d`; `--mark` (histogram hover marker) `#1b1a24` / `#eceaf4`.
- `--logo-3` (wordmark's quiet strand) `#9a99ab` / `#6b6a7d`.

### Named Rules
**The Colony-Only Colour Rule.** Outside the colony and its charts, the only chroma on screen is the hematoxylin accent and the amber and red status tints. Any new hue in the chrome must be justified as a status, not decoration.
**The Rare Violet Rule.** The accent marks selection, focus or the pinned creature. It is never a heading colour or a solid button or page fill. The single sanctioned tint use is dark-theme scenario run buttons, which take `--accent-soft` fill with `--accent` text.
**The Dye Mixing Rule.** Colony and ground colours are derived by mixing the dye ramp with a theme token (`--world-base`, `--body-tint`), not by picking fresh hexes.
**The Matched Contrast Rule.** A creature body against the ground behind its own hue stays near 2:1 in both themes, and the ground against the matte stays between about 1.3 and 1.5:1. Measured on the build: light bodies 1.8 to 2.5:1, dark bodies 1.8 to 2.2:1; light ground 1.2 to 1.4:1, dark ground 1.3 to 1.5:1. Dark gets there by mixing the ground 78% toward `#24232f` (the matte) and bodies 40% toward the same colour; light mixes the ground 58% toward paper and bodies 10% toward ink. Retune amounts, never add a halo or outline, if either ratio drifts.
**The One Source Rule.** Never hard-code a colour in CSS or JS. Add a token with both a `:root` and a `:root[data-theme="dark"]` value, and read it in JS through `readTheme()`.

## Typography

**UI Font:** Chivo (variable, 100 to 900; falls back to system-ui)
**Mono Font:** Chivo Mono (variable; falls back to ui-monospace) for DNA letters, counts, values and code
Both are self-hosted from `garden/web/fonts` as woff2 (OFL licences alongside); no network fonts.

**Character:** Chivo is a sturdy, slightly grotesque sans with real weight range, so hierarchy comes from weight and size inside one family. Its mono sibling keeps numbers and sequence letters visibly "data" without a second personality.

### Hierarchy
- **Brand** (780, 18px, -0.01em): the wordmark only.
- **Notice** (760, 20px, -0.01em, balanced wrap): the single heading of the "needs a wider window" note below 900px.
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

Top bar, left to right: brand, preset select, Restart world, spacer, creature count, generation count, speed control, achieved-speed readout, theme toggle, view toggle. The theme toggle is a 34px icon button directly before the view toggle.

Spacing rhythm is small and practical: 6px (button gaps), 8 to 10px (bar and row gaps), 14px (column and region gap), 18px (between controls), 20px (page edge), 28px (column gap), 26px between right-column sections.

Responsive ladder (all `max-width`):
- 1400px: columns tighten to 264px / flexible / 290px, column padding 20px, page padding 14px, speed buttons trim, the "achieved speed" readout hides, the preset select narrows to 112px wide.
- 1180px: the right column is removed entirely; two columns remain. Top bar gap 6px, speed buttons trim again.
- 1099px: the preset select hides.
- 990px: the generations counter hides. The creature count and the theme toggle never hide down to 900px.
- 899px: the top bar, banners and app are replaced by a centred "needs a wider window" notice.

The top bar fits by trimming sizes first and hiding controls last.

## Elevation & Depth

Flat by default. Regions are separated by space, hairlines and tonal washes, not shadows. Depth exists only on pieces that float over the world. Dark keeps the same rule with deeper, black-based shadows, because ink-tinted shadows vanish on near-black.

### Shadow Vocabulary
- **Float** (`--shadow-1`; light `0 1px 2px rgba(27, 26, 36, 0.08), 0 4px 14px rgba(27, 26, 36, 0.07)`, dark `0 1px 2px rgba(0, 0, 0, 0.45), 0 6px 18px rgba(0, 0, 0, 0.4)`): tool pill, hint pill, legend pill, toasts, the "Paused" pill. A soft offset-and-blur, never hard-edged.
- **Thumb** (`0 1px 3px var(--thumb-shadow)`): slider thumbs; switch knobs use `0 1px 2px var(--thumb-shadow)`.

### Named Rules
**The Floating-Only Rule.** Only elements that sit over the world get the Float shadow. Panels, columns, groups and charts stay flat.

## Shapes

Soft but not bubbly, with a small named scale. Controls have no borders; fills and the 2px focus ring define them. Hairlines are 1px bottom rules only (tabs, accordion groups, presets, panel foot).

Radius scale as built:
- **2px (hair):** slider tracks, gene bars, the tab underline, legend line swatches.
- **3px (ramp):** the 6px hue-ramp slider track.
- **4px (xs):** inline code in banners.
- **5px (tag):** override badge, colour swatch.
- **6px (key):** the small mono code button.
- **7px (inset):** the pressed pill inside the speed capsule, and its clip.
- **8px (sm):** buttons, option pairs, tool-pill buttons, focus corners on tabs and group heads.
- **10px (group):** the speed capsule, code blocks, error blocks, toasts, scrollbar thumb.
- **11px (knob):** the 38x22 switch track.
- **12px (md):** the tool pill, and the canvas inside the matte.
- **16px (lg):** the world matte.
- **999px (pill):** hints, legend, Paused pill, hook pills, pinned tag.
Circles (50%) are slider thumbs (16px, 2px accent ring), switch knobs (16px), legend dots (9px) and the error dot (7px). Sliders are 4px tracks (6px for the hue ramp). The scrolling control panel fades out over its last 56px through an alpha mask instead of ending in a hard edge.

## Components

### Buttons
- **Shape:** gently curved (8px), 34px minimum height, 6px 13px padding, no border.
- **Default:** Wash fill, ink text, weight 520. Hover goes to Deep Wash; press scales to 0.98 over 140ms.
- **Primary:** Ink fill, paper text, weight 600 ("Show the science", "Restart world" in the restart banner). Hover goes to `--ink-hover`. In dark the same rule yields a pale fill with near-black text.
- **Scenario run (dark only):** in the Scenarios tab, dark replaces the ink fill of the primary button with Hematoxylin Mist fill and accent text; light keeps the ink fill. The only dark-specific selector in the stylesheet besides the colour tokens.
- **Danger action:** same as default; hover turns Rose Wash with Signal Red text.
- **Select:** a default button with a custom ink-3 chevron drawn in CSS gradients.
- **Theme toggle:** 34px square icon button (18px inline SVG, 1.8 stroke). Three states cycled in order dark (the default), light, auto; the icon shows the current state (half disc, sun, moon) and the label names the next. Persisted as `gg.theme`.

### Selected pills (options, tools, speed)
Unselected is Wash with ink-2 text; selected fills with `--ink` and sets text to `--paper`, so it inverts with the theme. Two-up option grids (36px high, 6px gap) and the tool pill (32px buttons inside a raised pill) swap fill in 140ms.

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
Full-bleed rows under the top bar (error: Rose Wash, restart-needed: Amber Wash, offline: Rose Wash). They open by animating `grid-template-rows` over 420ms with the row fading in after an 80ms delay. Inline `code` is Chivo Mono on `--veil`; banner buttons are `--veil-2` tints, the primary one ink.

### Floating pills over the world
The tool pill (top-left), hint pill (top-centre, balanced wrap, fades and lifts 6px when dismissed), legend pill (bottom-right) and toasts (bottom-left, rise 8px in) are Raised with the Float shadow. Pills ignore pointer events except the tool pill. The legend uses 9px dots from `--sw-food`, `--pred`, `--series-pop` and `--series-food`.

### Creature card
Unboxed on the paper, heading with an accent "pinned" tag, four mono facts, then a two-column DNA grid. Each gene has name and value on one line, bases in Chivo Mono with the four tinted base colours, and a 3px accent bar (hue genes use their own lifted dye). Swapping creature re-runs the 240ms rise.

### Histogram row, tiles and charts
Three small mono stat tiles and two line charts (110px high canvases) sit on the paper without borders, each with a 12px legend of 3px line swatches. The per-gene histogram row sits beneath the world caption: a 12.5px ink-3 title, 64px canvas, `--mark` marker for the hovered creature. Bars use trait tokens or the lifted hue ramp. Canvas gridlines use `--axis-line`, text `--axis-text`.

### The world
A Wash matte (16px radius) holds the canvas. Ground is a ramp-tinted mix toward `--world-base`; creatures are dye bodies with a thin edge from `--creature-edge`; hover is a ring in `--hover-ring` and the pinned creature an accent ring with a dashed trail; predators use `--pred` with a faint dashed range. The caption beneath is one plain line: a bold ink "What's selecting" then ink-2 text.

### Theme switching
The theme is a `data-theme` attribute on `<html>`, resolved before first paint by an inline script in `index.html` (localStorage `gg.theme`: `light` gives light, `auto` follows the system `prefers-color-scheme`, and anything else, including nothing stored, gives dark), which also sets the `theme-color` meta. The toggle cycles dark, light, auto; the system-scheme listener acts only in auto. A change adds `.theme-fade` to the root for 450ms, crossfading background, colour, border, fill, stroke and shadow over 420ms on the house ease. Canvases are excluded from that fade: they drop to opacity 0 over 160ms, recolour (`readTheme()`, rebuild the ground, recolour bodies and legends, redraw charts) at 170ms, then fade in over 240ms. Reduced motion skips the canvas fade and snaps transitions to 0.01ms.

## Do's and Don'ts

### Do:
- **Do** keep chrome ink and paper and let colour come from the colony; draw any new data colour from the dye ramp or the chart token set.
- **Do** mark selection by filling through `--ink` with `--paper` text (it inverts in dark), and mark focus with the 2px accent outline.
- **Do** add a token with both a light and a dark value whenever a new colour is needed; never hard-code a colour in CSS or JS, and read it in JS through `readTheme()`.
- **Do** keep a creature body near 2:1 against the ground behind its own hue in both themes (ground to matte about 1.3 to 1.5:1); tune `--ground-amount` and `--body-amount`, not outlines.
- **Do** tint dark-theme scenario run buttons with `--accent-soft` fill and `--accent` text instead of the ink fill.
- **Do** separate regions with 14 to 28px of space, a 1px Hairline, or a Wash fill.
- **Do** use the one easing `cubic-bezier(0.16, 1, 0.3, 1)` with 140ms (hover, press), 240ms (fades, toggles) and 420ms (slides, expands, panel changes, theme crossfade).
- **Do** animate indicators by clipping a pre-drawn ink shape with measured offsets, and honour `prefers-reduced-motion` (the build clamps all durations to 0.01ms).
- **Do** set numbers, DNA letters and code in Chivo Mono with tabular numerals.
- **Do** keep text at 12px or larger, with `--ink-3` as the lightest text on paper in each theme.
- **Do** drop controls in this order as the window narrows: preset select (1099px), generations (990px); keep creature count and theme toggle until the 900px notice.

### Don't:
- **Don't** introduce teal, neon or any second accent, and don't give the dark theme a glowing accent; dark is the same quiet violet at lower light, not a neon dashboard.
- **Don't** build grids of bordered cards or wrap regions in outlined boxes. `.card` is a plain unboxed container.
- **Don't** use tracked, uppercase small-caps labels; labels are sentence case at 12px.
- **Don't** change font weight to show selected, hover or active state.
- **Don't** apply the Float shadow to anything that does not float over the world, and don't use hard-edged or offset-only shadows.
- **Don't** fill a heading or a page region with the accent, and don't use it as a solid button fill; the one tinted exception is the dark scenario run button.
- **Don't** load network fonts or swap in a system face for display text.
- **Don't** colour the ground or creatures with a fresh hex; mix the ramp with `--world-base` or `--body-tint`.
- **Don't** write theme-specific selectors for ordinary components; override tokens instead.

## Drift noted, not canonized

Colour literals the build still carries outside the token layer: the dye `STOPS` and the white lift target in `app.js`, the `theme-color` meta fallbacks (`#f3f2f7`, `#131219`) in `index.html`, and the single `:root[data-theme="dark"] .preset .btn.primary` rule. The surface-brief dark addendum diverges from the shipped build (it says ground 62% toward `#24232f`, bodies 6% toward white, and a sun/moon button at the foot of the left panel; the build uses 78%, 40% toward `#24232f`, and a three-state toggle in the top bar); the build is recorded here. The contract mentions a 316px side column; the shipped columns are 292px left and 344px right (264px and 290px at 1400px and below).
