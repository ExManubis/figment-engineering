# Pixel Perfection — Redesign Design Spec

**Date:** 2026-10-14
**Status:** Approved in brainstorm, pending written-spec review
**Supersedes:** `docs/pixel-perfection-design-spec.md` (the brown, single-screen studio page)

## 1. Intent

Pixel Perfection stays Mikkel Jørgensen's label, but the site changes job: from a Danish web-design studio pitch to an English, scrolling showcase of his personal, after-hours work. The visual language is rebuilt from scratch to be "both hacker and designer": near-black, monochrome, monospace, ASCII and dot-matrix motion, with the minimal restraint of thebrowser.company.

**Audience:** peers, recruiters and curious people in tech, not prospective clients.

**Success looks like:**
- The page reads as unmistakably Mikkel's: crafted, technical, calm.
- Claudewitz is shown, not described, through a live in-browser demo.
- Adding a second project is a data entry plus a demo component, with no layout work.
- Lighthouse performance ≥ 90 and accessibility 100 on mobile; motion degrades gracefully.

**Hard rules from the brainstorm:**
- No eyebrow labels, status pills, tag chips or meta rows. Hierarchy comes from size, space and colour.
- The site itself is monochrome. Colour appears only inside a project showcase, taken from that project's brand.

## 2. Page structure

A single scrolling page:

1. **Navigation** (fixed, top). Left: 56 px nav logo + `PIXEL PERFECTION`. Right: `WORK · ABOUT · CONTACT` anchor links. Same on mobile (no hamburger).
2. **Hero** (100vh). Large ray-traced logo, centred. Below it the motto *"Things I make when no one's asking."* No buttons, no scroll hint.
3. **Work.** One decode-framed showcase per project, rendered from `data/projects.ts`. At launch: Claudewitz only.
   - ANSI Shadow header `CLAUDEWITZ` and frame in Claudewitz orange.
   - One-line description.
   - Live demo: terminal recreation, then the headphone bean's dissolve-and-gather.
   - 3–4 short feature highlights.
   - Links: GitHub, and `brew install exmanubis/tap/claudewitz` as click-to-copy.
4. **About.** Monochrome decode frame. Dot-matrix portrait beside an `ABOUT` ANSI header and the bio:
   > I'm Mikkel Jørgensen, Design // AI Engineer at [smallclaims](https://smallclaims.ai) in Copenhagen. Pixel Perfection is what happens after hours: tools I wanted to exist, made with more care than anyone asked for.
5. **Footer.** Left: `SALES@PIXELPERFECTION.DEV · GITHUB · X · LINKEDIN`. Right: `© 2026 PIXEL PERFECTION`. No frame.

**Layout:** content max-width ≈ 960 px, centred. Section spacing ≈ 240 px desktop, ≈ 140 px mobile. One breakpoint at 640 px: frames and ANSI headers scale down (headers shrink, never wrap), About stacks portrait above text, hero logo uses a coarser grid.

## 3. Design system

### Colour (Tailwind v4 `@theme`)

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#0A0A0A` | Page background |
| `--color-fg` | `#EDEDED` | Primary text, active links |
| `--color-muted` | `#7A7A7A` | Secondary text, idle links (≈ 4.7:1 on bg) |
| `--color-subtle` | `#2A2A2A` | Idle frames, dividers |
| dot grid | white @ ≈ 8–10 % | Background dot grid in canvases, radially faded |

**Project colour:** each showcase sets `--brand` (and optional `--brand-2`) on its section element. Only the ANSI header and the decode frame use it, and only while the section's decode progress is above 0.5; otherwise they render in `--color-subtle` / `--color-fg`. Claudewitz: `--brand: #DA7756`, `--brand-2: #B497FF`. Project artwork (the bean) always shows its real colours.

### Typography

- **Departure Mono** is the only typeface. Self-hosted woff2 in `public/fonts/` with its OFL licence, preloaded. No Google Fonts.
- Sizes: labels 12 px uppercase, letter-spacing ≈ 0.14 em (nav, links, frame labels, footer); body ≈ 16 px / 1.6 (bio, descriptions); motto ≈ 20 px.
- **ANSI Shadow headers** are generated at build time with the `figlet` package (dev dependency) and rendered as `<pre aria-hidden="true">`. Font size is fitted to the container width so the header never wraps.

### Details

- Links: dotted underline, `--color-muted` → `--color-fg` on hover/focus. No visible buttons; interactive non-links are `<button>`s styled as mono text.
- Frame labels: ` 01 / CLAUDEWITZ ` set into the top border of the frame.
- Focus: visible 1 px `--color-fg` outline with 2 px offset.

### Brand assets

- **Favicon:** SVG + 32/16 px PNG + Apple touch icon, from a still of the nav logo (cube square-on in hairline brackets).
- **OG image:** 1200 × 630 PNG: a rendered hero-logo frame at the lock pose with the motto below. Also used as the no-JS hero fallback.

## 4. The logo

Abstract symbol "crop marks in 3D": the eight corners of an invisible cube, each marked by three short arms running back along the cube's edges (printer's crop marks in 3D), framing a solid cube, "the pixel", at the centre.

Reference prototype: `docs/brainstorm/2026-10-14-logo-animations/f3-a-vs-b-refined.html` (variant A) and `nav-logo-variants.html` (variant 2).

### Shared choreography (`pose(t)`)

- **Camera:** yaw advances exactly a quarter turn per 7 s cycle; pitch ≈ −0.5 rad ± 0.14 on the same 7 s period. Because the frame is symmetric under 90° yaw, every focus lock lands on the same three-quarter view (never side-on).
- **Cube tumble:** continuous rotation about a fixed oblique axis.
- **Focus lock:** every 7 s the cube slerps to face the viewer square-on (lock weight `w` eases in over 0.7 s from 3.6 s, out over 0.7 s from 6.1 s in each cycle), then releases into its tumble.
- The clock starts at an offset of ≈ 2.4 s so the first lock arrives ≈ 1.5 s after load.

### Hero logo (variant A, ray-traced dots)

- Canvas 2D, CPU sphere-traced signed distance field: three thin bars per corner (`ARM 0.38`, thickness 0.026) plus a bevelled cube (half-size 0.40, bevel 0.03). Brackets do **not** tighten on lock.
- Rendered onto a dot grid (≈ 124 × 95 cells desktop, ≈ 72 columns under 640 px). Per cell: one ray; edge anti-aliasing via closest-approach distance (partial coverage → smaller dot).
- Lighting: key light plus rim term, continuous grey (no banding steps).
- Background dot grid, radially faded.
- Runs at ≤ 30 fps.

### Nav logo (variant 2, hairline brackets)

- 56 × 56 css px canvas, 28 × 28 grid of 2 px cells, drawn as square pixels.
- Brackets: four 1-cell (2 px) hairline L-shapes, fixed to the pixel grid, never moving, grey `≈ 0.8`.
- Cube: same ray-traced cube as the hero (3 × 3 supersampled per cell), driven by the same `pose` clock with the camera's sway variant (gentle yaw ± 0.5 rad, never edge-on), locking in sync with the hero.

## 5. Decode frames

Box-drawing frame (`┌ ─ ┐ │ └ ┘`) drawn in a `<pre>` overlay around a section's content.

- **Scroll-linked progress** `p ∈ [0, 1]`: ramps 0 → 1 as the section's top travels from the bottom of the viewport to ≈ 72 % height, holds at 1, and ramps 1 → 0 as it leaves through the top ≈ 30 %. Scrolling back reverses it.
- **Per cell:** a seed `s = 0.6 · (perimeter index / perimeter length) + 0.25 · rand` (clockwise from top-left). If `p ≥ s + 0.12` show the final box character; if `p ≥ s` show a random glyph from `!<>-_\/[]{}=+*^?#%&$@~`; otherwise a space.
- **ANSI header** decodes in with the same rule (seeds by reading order). Body text never scrambles.
- Brand colour applies while `p > 0.5`.
- Glyph flicker updated at ≤ 30 fps; settled frames are not re-rendered. Geometry recomputed on resize.
- RNG is seedable so output is deterministic in tests.

## 6. Hero motto

Real DOM text (`<p>`), initially visually hidden. On the first focus lock it decodes in over ≈ 1.2 s using the decode rule (left to right with jitter), then stays static. Plays once per page load.

## 7. Claudewitz demo

`work/demos/ClaudewitzDemo.astro` + `lib/sparks/`.

1. Starts when the section is ≥ 50 % visible.
2. **Terminal:** types `$ brew install exmanubis/tap/claudewitz` (≈ 40 ms/char), prints three short output lines ending in `✓ claudewitz installed`, then `$ claudewitz`.
3. **Bean:** the bean appears as dots in its own colours. It bobs for ≈ 2 s (idle), dissolves into a swirl of sparks (working), then the sparks spring back into the bean (gathering). The bean phase loops.
4. Clicking/activating the terminal replays the whole sequence (`<button>` with accessible label; fires `demo_replayed`).
5. Paused when off-screen.

**Bean data:** extracted by `scripts/extract-bean.ts` from Claudewitz's `assets/logo-dark.svg` (the dot-matrix bean: circle positions and fills) into `src/data/claudewitz-bean.json`. The script is run manually and its output is committed, so the site build never depends on the Claudewitz repo. The spark motion is ported from `internal/tui/sparks.go` (swirl lanes, trail glow, gather spring), adapted to canvas.

## 8. Portrait

- Source photo supplied by Mikkel (head-and-shoulders, plain background). Until then a placeholder is used.
- Converted by `scripts/build-portrait.ts` into a dot-matrix cell map (luminance → dot size and grey), stored as `src/data/portrait.json`. Run manually when the photo changes; output committed.
- Rendered on canvas in the site's dot style. As the About frame decodes in, dots resolve from noise in random order tied to the frame's progress; then static.

## 9. Architecture

Astro (static) + Tailwind v4 + plain TypeScript modules. No UI framework. Canvas 2D everywhere; WebGL is a fallback plan only if the hero underperforms on real phones.

```
src/
  layouts/Layout.astro            head: SEO, OG, JSON-LD Person, font preload, Amplitude
  pages/index.astro
  components/
    global/Navigation.astro       nav logo canvas + links
    global/Footer.astro
    index/Hero.astro              hero canvas + motto
    frame/DecodeFrame.astro       props: label, brand?; slot
    type/AsciiHeader.astro        props: text; FIGlet at build time
    work/Showcase.astro           renders one project entry
    work/demos/ClaudewitzDemo.astro
    about/About.astro             portrait canvas + bio
  data/
    projects.ts                   typed project list
    claudewitz-bean.json          generated
    portrait.json                 generated
  lib/
    motion/scheduler.ts           single rAF loop; register/unregister; IntersectionObserver
                                  pause; visibilitychange; prefers-reduced-motion; fps caps
    dotgrid/paint.ts              canvas dot/square painter, AA, faded bg grid, DPR setup
    render/quat.ts, sdf.ts, raymarch.ts, pose.ts
    logo/hero.ts, logo/nav.ts
    decode/frame.ts, decode/text.ts, decode/rng.ts
    sparks/bean.ts
    portrait/dither.ts
scripts/                          run manually; outputs are committed
  extract-bean.ts                 logo-dark.svg → src/data/claudewitz-bean.json
  build-portrait.ts               photo → src/data/portrait.json
  render-og.ts                    OG image + favicons from the logo renderer → public/
```

**Project entry:**

```ts
type Project = {
  id: string;            // 'claudewitz'
  name: string;          // 'Claudewitz' (also the ANSI header text)
  label: string;         // frame label, e.g. '01 / CLAUDEWITZ'
  brand: { primary: string; secondary?: string };
  description: string;
  features: string[];    // 3–4 short lines
  links: { label: string; href?: string; copy?: string }[];
  demo: AstroComponent;  // e.g. ClaudewitzDemo
};
```

**Removed:** `scripts/cursor-trail.ts`, floating shapes, `assets/pixel-perfection-logo.svg`, `public/fonts/made_dillan.otf`, the Google Fonts link, the old colour tokens and keyframes. The old `docs/pixel-perfection-design-spec.md` and `docs/pixel-perfection-v11.html` stay in place as history; this spec supersedes them.

**Kept:** Astro, Tailwind v4, `@astrojs/sitemap`, Sentry integration and configs, Amplitude initialisation.

## 10. Reduced motion and no-JS

- **`prefers-reduced-motion: reduce`:** every animation renders its final state once: logo at the lock pose (still), frames complete, motto visible, demo shows the finished terminal and a still bean, portrait fully resolved. No glyph flicker.
- **No JavaScript:** all text is present and readable; frames fall back to a 1 px CSS border in `--color-subtle`; the hero shows the static OG logo PNG; the nav shows the static favicon SVG.

## 11. Accessibility

- Landmarks: `header`, `nav`, `main`, `footer`; each section is a `section` with a visually-hidden `h2`. Page `h1` is "Pixel Perfection" (visually hidden).
- ANSI headers and frames are `aria-hidden`; the hero canvas is `role="img"` with `aria-label="Pixel Perfection logo"`; other canvases are decorative.
- Click-to-copy and demo replay are `<button>`s; copy confirms via an `aria-live` region.
- Keyboard focus visible everywhere; contrast ≥ AA.

## 12. SEO

- `lang="en"`. Title: `Pixel Perfection: Mikkel Jørgensen`. Description built from the motto and bio.
- OG/Twitter tags with the OG image, `og:locale` `en_US`.
- JSON-LD: `Person` (name, jobTitle "Design // AI Engineer", worksFor smallclaims, sameAs GitHub/X/LinkedIn) with `brand` Pixel Perfection. The `ProfessionalService`, `taxID` and `priceRange` data are removed.
- Sitemap and canonical unchanged.

## 13. Analytics and errors

- Amplitude autocapture unchanged; explicit events `install_command_copied` and `demo_replayed`.
- Each animation mounts inside `try/catch`; failures report to Sentry and leave the no-JS fallback in place.
- **Slow-device guard:** if the hero averages > 50 ms per frame over 2 s it switches to a coarser grid; if still too slow, to the static image.

## 14. Testing

- **Vitest** (new dev dependency) unit tests for pure modules: quaternion maths; `pose` (lock timing, and that every lock lands on the same three-quarter view); decode frame and text (seeded, deterministic); FIGlet header generation; bean point extraction; portrait dithering; scheduler pause/resume logic.
- **Visual verification** in Chrome DevTools at desktop and 390 px mobile; reduced-motion and no-JS passes.
- **Lighthouse** on mobile: performance ≥ 90, accessibility 100.
- `astro build` succeeds.

## 15. Open items (content, not design)

- Mikkel's portrait photo (placeholder until supplied).
- X and LinkedIn profile URLs (placeholders until supplied).
- Final wording of the Claudewitz description and 3–4 feature lines (draft from the Claudewitz README during implementation, for Mikkel to approve).
