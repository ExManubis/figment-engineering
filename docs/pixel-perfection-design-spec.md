# Pixel Perfection — Landing Page Design Specification

## Overview

Single-screen, no-scroll landing page for Pixel Perfection, a freelance web design and development studio based in Copenhagen. The design is ultra-minimal, inspired by [thebrowser.company](https://www.thebrowser.company/) — just a headline, navigation links, footer, and ambient animations. No buttons, no sections, no cards.

The page should fill exactly one viewport. `html` and `body` are `height: 100%` with `overflow: hidden`.

---

## Brand Colors

| Name         | Hex       | Usage                                      |
|--------------|-----------|---------------------------------------------|
| Burnt Brown  | `#974B00` | Brand primary, logo stem                    |
| Dark Brown   | `#5C2E00` | Page background                             |
| Dusty Rose   | `#AA4E7E` | Logo bowl, cursor trail, floating shape     |
| Warm Sand    | `#D8A86E` | Hero accent word ("everyone."), logo circle |
| Cream        | `#EDDA9A` | Primary text color, logo elements           |

All text on the page uses `#EDDA9A` at varying opacities for hierarchy. No other text colors are used.

---

## Typography

Three font families loaded from Google Fonts:

### EB Garamond (Serif — Hero headline only)
- **Import weights**: 400, 500, 600, 700 (normal + italic)
- **Usage**: `h1` only
- **Weight**: 500
- **Size**: `clamp(3rem, 5.5vw, 4.8rem)`
- **Line height**: 1.2
- **Letter spacing**: -0.03em
- **Color**: `#EDDA9A`
- **Max width**: 620px, centered
- **Fallback stack**: `'EB Garamond', 'Garamond', Georgia, serif`

### Syne (Sans-serif — Logo wordmark)
- **Import weights**: 400, 500, 600, 700, 800
- **Usage**: Logo wordmark text only
- **Weight**: 700
- **Size**: 15px
- **Color**: `#EDDA9A`

### DM Sans (Sans-serif — Body/UI)
- **Import weights**: 400, 500 (normal + italic)
- **Usage**: Body default, navigation links, footer links, copyright
- **Set on**: `body` element, inherited everywhere except `h1` and `.logo-text`
- **Nav/footer link size**: 13px
- **Copyright size**: 12px

---

## Layout Structure

The page is a flex column with three vertical zones:

```
┌─────────────────────────────────────────┐
│ header (top)                            │
│   logo (left) ── nav links (right)      │
│                                         │
│                                         │
│ main (center, flex: 1)                  │
│           h1 centered                   │
│                                         │
│                                         │
│ footer (bottom)                         │
│   social links (left) ── © (right)      │
└─────────────────────────────────────────┘
```

- **Body padding**: `2rem 3rem` (desktop), `1.5rem` (mobile ≤600px)
- **Body display**: `flex`, `flex-direction: column`
- **Main**: `flex: 1`, `display: flex`, `align-items: center`, `justify-content: center`
- All three zones have `z-index: 10` and `position: relative` to sit above the decorative layers

---

## Header

- Flexbox row, `justify-content: space-between`, `align-items: center`
- **Left**: Logo (SVG mark + wordmark text)
- **Right**: Three text links — "Work", "About", "Contact"

### Logo SVG (inline, 18×21px display size)
- `viewBox="0 0 120 140"`
- Stem: `<rect x="12" y="8" width="40" height="108" rx="11" fill="#EDDA9A" opacity="0.8"/>`
- Bowl: `<rect x="34" y="8" width="48" height="48" rx="12" fill="#AA4E7E" opacity="0.6"/>`
- Circle 1: `<circle cx="76" cy="78" r="15" fill="#D8A86E" opacity="0.65"/>`
- Circle 2: `<circle cx="92" cy="104" r="8" fill="#EDDA9A" opacity="0.5"/>`

Note: This is the light-on-dark version of the logo. The full-color neumorphic version (with gradients and drop shadows) exists as a separate SVG asset for other contexts.

### Nav links
- `font-size: 13px`
- `color: #EDDA9A`, `opacity: 0.4`
- Hover: `opacity: 0.9`
- `transition: opacity 0.3s`
- Gap between links: `2rem`

---

## Hero (h1)

The headline reads: **"Great design should be for everyone."**

Each word is wrapped in a `<span class="word">` for the word-by-word entrance animation. The final word "everyone." has an additional class `.accent`.

```html
<h1>
  <span class="word">Great</span>
  <span class="word">design</span>
  <span class="word">should</span>
  <span class="word">be</span>
  <span class="word">for</span>
  <span class="word accent">everyone.</span>
</h1>
```

### Accent word styling
- `color: #D8A86E` (warm sand instead of cream)
- `font-style: italic`

---

## Footer

- Flexbox row, `justify-content: space-between`, `align-items: flex-end`

### Left — Social/contact links
- "Instagram", "LinkedIn", "hello@pixelperfection.dk"
- `font-size: 13px`, `color: #EDDA9A`, `opacity: 0.3`
- Hover: `opacity: 0.8`
- `transition: opacity 0.3s`
- Gap: `1.75rem`

### Right — Copyright
- "© 2026 Pixel Perfection"
- `font-size: 12px`, `color: #EDDA9A`, `opacity: 0.15`

---

## Animations

### 1. Page load — Staggered entrance

Everything fades in on load with CSS animations. No scroll triggers.

| Element       | Animation    | Duration | Delay  |
|---------------|-------------|----------|--------|
| Logo          | slideDown   | 0.6s     | 0.15s  |
| Header links  | slideDown   | 0.6s     | 0.25s  |
| Hero word 1   | wordIn      | 0.5s     | 0.3s   |
| Hero word 2   | wordIn      | 0.5s     | 0.38s  |
| Hero word 3   | wordIn      | 0.5s     | 0.46s  |
| Hero word 4   | wordIn      | 0.5s     | 0.54s  |
| Hero word 5   | wordIn      | 0.5s     | 0.62s  |
| Hero word 6   | wordIn      | 0.5s     | 0.72s  |
| Footer        | fadeIn      | 0.6s     | 0.9s   |
| Shape 1       | shapeIn     | 1.5s     | 0.8s   |
| Shape 2       | shapeIn     | 1.5s     | 1.0s   |
| Shape 3       | shapeIn     | 1.5s     | 1.2s   |

All elements start with `opacity: 0` and use `animation-fill-mode: forwards`.

#### Keyframes

```css
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes wordIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes shapeIn {
  from { opacity: 0; }
  to { opacity: var(--op); }
}
```

### 2. Floating background shapes

Three decorative shapes float slowly on infinite loops. They sit at `z-index: 0` with `position: fixed` and `pointer-events: none`.

| Shape   | Size   | Border Radius | Color     | Target Opacity | Float Duration | Position            |
|---------|--------|---------------|-----------|----------------|----------------|---------------------|
| shape-1 | 70×70  | 16px (square) | `#AA4E7E` | 0.06           | 16s            | top: 14%, right: 10%|
| shape-2 | 40×40  | 50% (circle)  | `#D8A86E` | 0.07           | 20s            | bottom: 20%, left: 7%|
| shape-3 | 24×24  | 50% (circle)  | `#EDDA9A` | 0.08           | 13s            | top: 58%, right: 16%|

Each has a unique float keyframe that gently translates and (for shape-1) rotates. All loops use `ease-in-out` and start after a 2s delay.

```css
@keyframes float1 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(-10px, 14px) rotate(3deg); }
  50% { transform: translate(6px, -10px) rotate(-2deg); }
  75% { transform: translate(-4px, 6px) rotate(1deg); }
}

@keyframes float2 {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(12px, -12px); }
  66% { transform: translate(-8px, 10px); }
}

@keyframes float3 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-14px, -10px); }
}
```

### 3. Pixel cursor trail (Canvas)

A `<canvas>` element covers the full viewport at `z-index: 1` with `pointer-events: none`. JavaScript draws 12×12px solid squares in `#AA4E7E` (dusty rose) that follow the mouse cursor and fade out.

#### Behavior
- On `mousemove`, squares are spawned along the path between the previous and current mouse position
- A new square is placed every ~12px of mouse travel
- Squares are snapped to a 12px grid (`Math.round(pos / 12) * 12`) for a crisp pixel-art feel
- Each square spawns at `opacity: 0.55`
- Squares fade out over **800ms** using an ease-out curve: `opacity = 0.55 * (1 - progress²)`
- Squares do not move, rotate, or change size after spawning — they simply fade in place
- Minimum mouse travel distance of 8px before spawning begins (prevents idle spawning)
- Canvas handles devicePixelRatio for crisp rendering on retina displays
- Hidden on mobile (≤600px) via `display: none`

#### Implementation

```javascript
const PIXEL_SIZE = 12;
const FADE_DURATION = 800;
const SPAWN_INTERVAL = 12;  // px of mouse travel between spawns
const MIN_DISTANCE = 8;     // minimum travel before spawning
const INITIAL_OPACITY = 0.55;
const COLOR = '#AA4E7E';

// Spawn: for each SPAWN_INTERVAL along mouse path,
//   snap to PIXEL_SIZE grid, push to array with born timestamp

// Animate: each frame, clear canvas,
//   for each pixel: age = now - born
//   if age > FADE_DURATION: remove
//   else: progress = age / FADE_DURATION
//         alpha = INITIAL_OPACITY * (1 - progress * progress)
//         fillRect(x - PIXEL_SIZE/2, y - PIXEL_SIZE/2, PIXEL_SIZE, PIXEL_SIZE)
```

---

## Texture Overlay

A film grain effect is applied via `body::after` pseudo-element:

- `position: fixed`, `inset: 0`
- `pointer-events: none`, `z-index: 100` (above everything including canvas)
- `opacity: 0.06`
- Uses an inline SVG data URI with `feTurbulence` filter (`fractalNoise`, `baseFrequency: 0.8`, `numOctaves: 4`)
- `background-size: 200px 200px` (tiled)

---

## Responsive

Only one breakpoint at `max-width: 600px`:

- Body padding reduces to `1.5rem`
- Header link gap reduces to `1.25rem`
- Canvas trail is hidden
- Font sizes naturally adapt via `clamp()` on the headline

---

## Z-Index Stack

| Layer            | Z-Index |
|------------------|---------|
| Floating shapes  | 0       |
| Canvas trail     | 1       |
| Header/Main/Footer | 10   |
| Grain overlay    | 100     |

---

## Assets

### Logo SVG — Full color neumorphic version (for marketing, large display)

Uses linear gradients and dual drop-shadow filter for a tactile, raised appearance:

- **Stem**: gradient `#b85c0a` → `#7a3d00`
- **Bowl**: gradient `#bf6090` → `#8e3e68`, opacity 0.9
- **Sand circle**: gradient `#e4ba82` → `#c4935a`, opacity 0.92
- **Cream circle**: gradient `#f5e8ae` → `#d8c880`, opacity 0.95
- **Filter**: `feDropShadow dx="3" dy="3" stdDeviation="4" flood-opacity="0.4"` (dark) + `feDropShadow dx="-2" dy="-2" stdDeviation="3" flood-color="#5a3a1a" flood-opacity="0.25"` (warm highlight)

### Logo SVG — Flat version (for favicon, small sizes)

Solid brand colors, no effects:

- Stem: `#974B00`
- Bowl: `#AA4E7E`, opacity 0.88
- Sand circle: `#D8A86E`, opacity 0.9
- Cream circle: `#EDDA9A`, opacity 0.95

### Logo SVG — Light-on-dark version (used in current page header/footer)

Cream/white tones for dark backgrounds:

- Stem: `#EDDA9A`, opacity 0.8
- Bowl: `#AA4E7E`, opacity 0.6
- Sand circle: `#D8A86E`, opacity 0.65
- Cream circle: `#EDDA9A`, opacity 0.5

---

## Reference File

The current working HTML prototype is `pixel-perfection-v11.html`. It contains all styles inline and the canvas trail script at the bottom of `<body>`. For the Astro project, the canvas logic should be extracted into a client-side component/script with `client:only` or a `<script>` tag in the Astro layout.
