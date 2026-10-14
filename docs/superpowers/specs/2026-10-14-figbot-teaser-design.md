# Figbot Teaser Visuals — Design Spec

**Date:** 2026-10-14
**Status:** Approved in brainstorm, pending written-spec review

## 1. Intent

Figbot is an upcoming product that will get a living mascot: a friendly assistant character that reacts with states. This spec covers only the **teaser visuals**, a reference set that fixes the character's look and expressions before the real living mascot is built.

The character takes inspiration from the Grok Bot icon (a soft sphere peeking in from a corner, a face made only of eyes, personality carried by motion) without copying it. Grok's tilted pill eyes are explicitly avoided.

**Success looks like:**
- Figbot reads as a friendly assistant with personality, while staying very simple.
- The seven expressions are clearly distinct from one another at a glance.
- Every output is reproducible from code, pixel-identical between runs.
- The pose model can later drive the living mascot unchanged.

**Hard rules from the brainstorm:**
- Monochrome only: `#F2F2F2` dots on `#0A0A0A`.
- Built from dots (halftone), matching the site's dot-matrix language.
- No wordmark on any output.
- Nothing ships to the pixel-perfection site.

## 2. Character

### Body
A halftone sphere peeking in from the bottom of the frame, slightly left of centre. It is lit from the upper left.

All coordinates are normalised to the frame, `u, v ∈ [0, 1]`, with `v` pointing down.

- **Geometry:** centre `(0.58, 0.70)`, radius `0.64`.
- **Light:** direction `normalize(-0.55, -0.65, 0.55)`. The view direction is `+z`.
- **Luminance:** `exposure · (0.06 + 0.78·(n·l) + 0.5·(n·h)^40 + 0.12·(1 − z)^3)`, clamped to `[0, 1]`. Here `h` is the Blinn half-vector, and the last term is the rim.
- **Dots:** dot radius = `√lum · cell · 0.52`. Cells with a radius below about 0.5 px are skipped.

### Eyes
Two tall ovals cut out of the dots as holes (`lum = 0`), each with a one-dot-cluster **glint** (`lum = 1`).

- **Base eye:** `rx = 0.105`, `ry = 0.16`.
- **Eye centres:** left `(0.37, 0.45)`, right `(0.69, 0.41)`.
- **Inner-direction sign:** `+1` for the left eye, `−1` for the right.
- **Glint:** a circle of radius `0.034·scale` at offset `(−0.32·rx, −0.42·ry)` from the eye centre. It is drawn only when `glint` is true, `lid < 0.25` and `open > 0.6`.

### Pose
A pose is plain data:

```ts
interface EyePose { scale: number; sx: number; lid: number; low: number; slant: number }
interface Pose {
  shape: 'oval' | 'arc' | 'chevron';   // oval = normal; arc = ^ ; chevron = > <
  open: number;                        // 0..1 vertical openness of ovals (blink)
  gx: number; gy: number;              // gaze offset, frame units
  tilt: number;                        // face rotation (radians) about the body centre
  squash: number;                      // + wider/shorter body, − taller; anchored low
  bob: number;                         // vertical body offset; eyes move with it
  glint: boolean;
  exposure: number;                    // body luminance multiplier
  eyes: [EyePose, EyePose];            // [left, right]
}
```

**Per-eye fields**
- `scale` scales the whole eye. `sx` adds extra horizontal scale.
- `lid` is an upper eyelid. It hides everything above `ey − ry + lid·2ry − slant·inner·dx`.
- `slant` raises the inner corner of that eyelid, which gives the worried look.
- `low` is a lower eyelid. It hides everything below `ey + ry − low·2ry`.

**Shape-specific geometry**
- `arc` (^): the upper half of an elliptical ring. Normalised distance with radii `(rx, 0.8·ry)` must lie in `(0.42, 1.0)`, and `dy < 0.02`.
- `chevron`: two capsule segments of half-thickness `0.034`, meeting at a tip that points inward:
  - tip at `(ex + inner·0.75·rx, ey)`
  - arms ending at `(ex − inner·0.85·rx, ey ∓ 0.7·ry)`

**Face transforms**
- **Squash:** the body radii become `R·(1 + squash)` horizontally and `R·(1 − squash)` vertically. The centre moves down by `0.6·(R − Ry)` so the body stays anchored to the bottom of the frame.
- **Tilt:** eye shapes are tested in face space, which means the sample point is rotated by `−tilt` about the body centre.
- **Bob:** applies to the body and the eyes together. This is a deliberate change from the prototype, where only the body moved.

**Interpolation**
Two poses are blended with `lerp(a, b, k)`:
- Numeric fields interpolate linearly.
- `shape` and `glint` switch at `k = 0.5`.
- A shape change always passes through a blink (`open → 0.06`), so the swap is hidden.

## 3. Expressions

These are the default values. Each expression overrides only the fields listed.

- **Default pose:** `shape: 'oval'`, `open: 1`, `gx = gy = tilt = squash = bob = 0`, `glint: true`, `exposure: 1`.
- **Default eye:** `scale: 1`, `sx: 1`, `lid: 0`, `low: 0`, `slant: 0`.

| Name | Overrides |
|---|---|
| **Idle** | none |
| **Curious** | `tilt 0.2, gx 0.035, gy −0.03`; left `{scale 0.86, lid 0.12}`, right `{scale 1.16}` |
| **Happy** | `shape arc, squash 0.05, bob −0.02` |
| **Excited** | `shape chevron, squash 0.07, bob −0.03, tilt −0.08` |
| **Thinking** | `tilt −0.1, gx 0.04, gy −0.06, glint false`; both eyes `{scale 0.95, low 0.38}`. While shown, `gx` drifts by `0.012·sin(ω_d·t)` with `ω_d = 2π·2/14` (about 0.90 rad/s), scaled by the pose's blend weight |
| **Sleepy** | `tilt 0.24, gy 0.025, glint false, exposure 0.7, bob 0.02`; left `{lid 0.72}`, right `{lid 0.66}` |
| **Worried** | `gx −0.02, gy 0.03, squash 0.03`; both eyes `{scale 0.92, lid 0.3, slant 1.4}` |

Every pose also gets an idle **breath**: `bob += 0.006·sin(ω_b·t)` with `ω_b = 2π·3/14` (about 1.35 rad/s, so 3 breaths per loop).

**Blink** is an animation, not an expression. `open` dips to `0.06` and back over about 0.18 s.

The reference prototypes are kept in `.superpowers/brainstorm/7657-1792006037/content/` (gitignored):
- `expressions-v3.html`: approved look, minus Surprised.
- `thinking.html`: Thinking variant A.

If they disagree with the tables above, the tables in this spec win.

## 4. Loop timeline

The loop lasts 14 s at 30 fps, which is 420 frames. Frame 420 equals frame 0, so the loop is seamless.

**Transitions**
- Each transition is a 0.35 s smoothstep blend between consecutive holds.
- A transition whose `shape` changes goes through a blink.

**Holds**

| Start (s) | Pose | Notes |
|---|---|---|
| 0.0 | Idle | blink at 1.2 s |
| 2.0 | Curious | |
| 3.8 | Thinking | |
| 5.8 | Happy | |
| 7.2 | Excited | |
| 8.6 | Worried | |
| 10.2 | Sleepy | |
| 12.4 | Idle | starts with a wake blink; ends exactly as at 0.0 |

The breath and the Thinking drift use the frequencies given in section 3. Both complete a whole number of cycles in 14 s, so the loop stays seamless.

## 5. Outputs

Everything is written to `figbot/out/` and committed.

**Grid density.** The dot grid is a fixed **48 columns across the frame**, whatever the output size. Square outputs are 48 × 48 cells. The wide output is 85 × 48 cells, with the character framed at the left-centre third.

| File | Size | Content |
|---|---|---|
| `hero-square.png` / `.svg` | 2048² | Idle, still |
| `hero-wide.png` | 2560×1440 | Idle, still; sphere bottom-left, black space to the right |
| `expressions/<name>.png` | 1024² each | The 7 poses, still, no breath |
| `sheet.png` | about 2400 wide | 4 + 3 grid of the 7 poses, labelled below each tile in Departure Mono (`scripts/assets/DepartureMono-Regular.otf`) at 40% opacity |
| `loop.mp4` | 1080², 30 fps | H.264, `yuv420p`, `-crf 18` |
| `loop.gif` | 540², 15 fps | ffmpeg `palettegen` / `paletteuse` |
| `live.html` | one self-contained file | See below |

**Rendering pipeline.** Figbot has its own small SVG emitter, `figbot/src/svg.ts`, which writes one `<circle>` per lit cell. The site's `cellsToSvg` isn't used, because its `dotRadius` (0.16–0.43 of a cell) can't produce the halftone ramp (`√lum · 0.52`). The SVG is rasterised with `@resvg/resvg-js`. MP4 frames are rendered one by one to a temporary directory and encoded with `ffmpeg`.

**Live page (`live.html`)**
- Fills the window and renders on a canvas in real time.
- Plays the loop by default.
- Keys `1`–`7` jump to an expression, through an animated `lerp`, and pause the loop. `0` resumes it.
- Honours `prefers-reduced-motion` by showing Idle, still.
- `live.ts` is bundled into the file with esbuild, which is already in `node_modules` as a dependency of vite. No new dependencies.

## 6. Code layout

```
figbot/
  src/model.ts        Pose types, DEFAULT_POSE, POSES, lerp(), sample(pose, u, v) → lum | hole | bg, cells(pose, cols, rows)
  src/model.test.ts
  src/timeline.ts     KEYFRAMES, poseAt(t)
  src/timeline.test.ts
  src/svg.ts          cells → SVG string (halftone circles)
  src/live.ts         canvas driver
  render.ts           `npx tsx figbot/render.ts` → all of figbot/out/
  out/                committed outputs
```

`model.ts` and `timeline.ts` are pure, with no DOM, filesystem or time access.

The only change outside `figbot/` is adding `'figbot/**/*.test.ts'` to `vitest.config.ts`. The root `tsconfig.json` already includes `**/*`, so typecheck covers the folder.

## 7. Testing

Vitest, written test-first for the pure modules.

**`model`**
- Idle: the cell at each eye centre is a hole, and the glint cell is lit.
- Happy: the cell at the eye centre is skin (the inside of the arc) and a cell on the upper arc is a hole.
- Excited: the chevron tip cell is a hole.
- Sleepy: the cell near the top of the eye is skin, because the eyelid covers it.
- Worried: at the same height near the eyelid line, the outer cell is skin and the inner cell is a hole.
- Squash keeps the bottom-centre cell inside the body.
- Tilt moves the eye-centre hole.
- `lerp(a, b, 0)` deep-equals `a`, and `lerp(a, b, 1)` deep-equals `b`.

**`timeline`**
- `poseAt(0)` deep-equals `poseAt(14)`.
- `poseAt` at each hold's midpoint equals that pose, plus the breath.
- A shape change passes through `open ≤ 0.1`.

**Render smoke check (manual)**
Run the script, then confirm:
- every file exists,
- `ffprobe` reports 420 frames at 1080²,
- the PNGs look right by eye.

## 8. Out of scope

- The living mascot itself: the app integration, state machine and input reactions.
- A wordmark or other typography beyond the sheet labels.
- Colour variants.
- Changes to the pixel-perfection site.
