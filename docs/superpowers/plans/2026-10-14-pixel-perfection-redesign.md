# Pixel Perfection Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild pixelperfection.dev as an English, monochrome, Departure-Mono, single scrolling page: ray-traced dot-matrix logo hero, decode-framed Claudewitz showcase with a live demo, dot-matrix About, minimal footer.

**Architecture:** Astro static site, Tailwind v4 tokens, and plain TypeScript modules in `src/lib/`. All animation logic is pure and unit-tested (Vitest); thin DOM "mount" modules wire it to canvases/`<pre>` elements through one shared `requestAnimationFrame` scheduler that pauses off-screen work. Data the build needs from outside the repo (Claudewitz bean dots, portrait, OG/favicons) is produced by manually-run scripts whose output is committed.

**Tech Stack:** Astro 6, Tailwind CSS 4, TypeScript (strict), Vitest 5, `figlet` (build-time ANSI headers), `tsx` (scripts), `pngjs` (portrait), `@resvg/resvg-js` (OG/favicon rasterising), Canvas 2D. Existing: Amplitude (`@amplitude/unified`), Sentry (`@sentry/astro`), `@astrojs/sitemap`.

**Spec:** `docs/superpowers/specs/2026-10-14-pixel-perfection-redesign-design.md` — read it before starting. Visual reference prototypes (open in a browser): `docs/brainstorm/2026-10-14-logo-animations/f3-a-vs-b-refined.html` (hero = variant A) and `nav-logo-variants.html` (nav = variant 2, "hairline").

## Global Constraints

- Language `en`; all copy in English. Site is monochrome: `--color-bg #0A0A0A`, `--color-fg #EDEDED`, `--color-muted #7A7A7A`, `--color-subtle #2A2A2A`. Colour only via a showcase's `--brand` on its ANSI header and frame, only while the frame's progress `p > 0.5`. Claudewitz `--brand: #DA7756`, `--brand-2: #B497FF`.
- Departure Mono is the only typeface, self-hosted woff2 with its OFL licence. No Google Fonts.
- No eyebrow labels, status pills, tag chips or meta rows anywhere.
- No visible buttons: interactive non-links are `<button>`s styled as mono text.
- Labels: 12 px uppercase, letter-spacing 0.14 em. Body ≈ 16 px / 1.6. Motto ≈ 20 px.
- Content max-width ≈ 960 px; section gap ≈ 240 px desktop / ≈ 140 px below 640 px. One breakpoint: 640 px (Tailwind `sm`).
- Animations: ≤ 30 fps for ray-traced work; every animation pauses when off-screen; `prefers-reduced-motion: reduce` renders final states once with no flicker; each animation's failure is reported to Sentry and leaves its no-JS fallback.
- Motto: `Things I make when no one's asking.` Bio: `I'm Mikkel Jørgensen, Design // AI Engineer at smallclaims in Copenhagen. Pixel Perfection is what happens after hours: tools I wanted to exist, made with more care than anyone asked for.` (`smallclaims` links to `https://smallclaims.ai`.)
- Contact email `sales@pixelperfection.dev`; GitHub `https://github.com/ExManubis`. X and LinkedIn URLs are not supplied yet: links without a URL are not rendered (spec §15).
- Commit after every task on branch `mikkel/redesign`. Never commit `.env*`.

## Review Focus

1. **390 px-wide phones:** the nav (56 px logo + `PIXEL PERFECTION` + three links) overflows; expect the wordmark text to hide below 480 px while the logo stays. Frame labels longer than a narrow frame must be truncated, not break the border (Task 3 `layoutFrame` truncation test; Task 8 visual check at 390 px).
2. **Sections taller than the viewport** (the Claudewitz showcase with its demo): the frame must stay fully decoded while the section covers the screen, not flicker out mid-read (Task 3 `scrollProgress` "covers viewport" test).
3. **Tab hidden or section off-screen for minutes, then back:** no huge time jumps (sparks flying off, motto skipping) — scheduler clamps `dt` to 0.1 s and the spark sim uses fixed ticks (Task 2 dt-clamp test; Task 9 fixed-step design).
4. **Clipboard unavailable or denied** (non-HTTPS preview, permissions): the copy button reports failure in the live region instead of throwing or claiming success (Task 10 `copyText` tests).
5. **Resize / orientation change / font swap after first paint:** frames re-measure and re-layout without throwing for tiny sizes (Task 3 degenerate-size test; Task 4 ResizeObserver + `document.fonts.ready` relayout).

---

## File Structure

```
src/
  styles/global.css                 tokens, base, utility classes (Task 1)
  layouts/Layout.astro              head/SEO/fonts/analytics (Task 1, icons in Task 12)
  pages/index.astro                 page composition (Task 1, grows per task)
  data/
    site.ts                         email, social links, footer links (Task 1)
    projects.ts                     project entries (Task 10)
    claudewitz-bean.json            generated (Task 9)
    portrait.json                   generated (Task 11)
  components/
    global/Navigation.astro         (Task 1 skeleton → Task 8 final)
    global/Footer.astro             (Task 1)
    index/Hero.astro                (Task 1 skeleton → Task 7 final)
    frame/DecodeFrame.astro         (Task 4)
    type/AsciiHeader.astro          (Task 4)
    about/About.astro               (Task 4 text → Task 11 portrait)
    work/Showcase.astro             (Task 10)
    work/demos/ClaudewitzDemo.astro (Task 10)
  lib/
    report.ts                       Sentry reporting (Task 1)
    analytics.ts                    Amplitude init/track (Task 1)
    seo.ts (+ .test)                SITE + Person JSON-LD (Task 1)
    motion/scheduler.ts (+ .test)   shared rAF loop (Task 2)
    decode/rng.ts, frame.ts, text.ts (+ tests)  (Task 3)
    decode/mount.ts                 DOM wiring for frames (Task 4)
    type/figlet.ts (+ .test), fit.ts (Task 4)
    render/quat.ts, sdf.ts, pose.ts (+ tests) (Task 5)
    render/raymarch.ts (+ .test)    (Task 6)
    dotgrid/paint.ts, svg.ts (+ tests) (Task 6)
    logo/hero.ts                    (Task 7)
    logo/nav.ts (+ .test)           (Task 8)
    sparks/parse.ts, field.ts, demo.ts (+ tests), mount.ts (Task 9–10)
    copy/clipboard.ts (+ .test), mount.ts (Task 10)
    portrait/dither.ts (+ .test), mount.ts (Task 11)
scripts/
  extract-bean.ts (Task 9)  build-portrait.ts (Task 11)  render-assets.ts (Task 12)
  assets/DepartureMono-Regular.otf (Task 12)
public/
  fonts/DepartureMono-Regular.woff2, DepartureMono-LICENSE.txt (Task 1)
  favicon.svg, favicon-32.png, apple-touch-icon.png, og.png, logo-still.png (Task 12)
vitest.config.ts (Task 1)
```

Removed in Task 1: `src/scripts/cursor-trail.ts`, `src/assets/pixel-perfection-logo.svg`, `public/fonts/made_dillan.otf`, old `src/components/index/Hero.astro` content.

---

### Task 1: Foundation — tooling, tokens, layout, SEO, cleanup

**Files:**
- Modify: `package.json`, `src/styles/global.css` (rewrite), `src/layouts/Layout.astro` (rewrite), `src/pages/index.astro` (rewrite), `src/components/global/Navigation.astro` (rewrite), `src/components/global/Footer.astro` (rewrite), `src/components/index/Hero.astro` (rewrite)
- Create: `vitest.config.ts`, `src/data/site.ts`, `src/lib/seo.ts`, `src/lib/seo.test.ts`, `src/lib/report.ts`, `src/lib/analytics.ts`, `public/fonts/DepartureMono-Regular.woff2`, `public/fonts/DepartureMono-LICENSE.txt`
- Delete: `src/scripts/cursor-trail.ts`, `src/assets/pixel-perfection-logo.svg`, `public/fonts/made_dillan.otf`

**Interfaces:**
- Produces: `SITE: { url: string; title: string; description: string; motto: string }`, `personJsonLd(social?): object` (`src/lib/seo.ts`); `EMAIL: string`, `social: { github: string; x?: string; linkedin?: string }`, `footerLinks(): { label: string; href: string }[]` (`src/data/site.ts`); `reportError(err: unknown): void` (`src/lib/report.ts`); `initAnalytics(): void`, `track(event: string): void` (`src/lib/analytics.ts`). CSS utilities `.label`, `.link`, `.js-hide`, `.no-js-hide`; `html.js` class set before paint.

- [ ] **Step 1: Install dev dependencies and add the test script**

```bash
npm install
npm install -D vitest@^5 figlet@^1.12 tsx@^4 pngjs@^7 @types/pngjs @resvg/resvg-js
npm pkg set scripts.test="vitest run"
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 2: Add the font**

```bash
mkdir -p public/fonts
cp docs/brainstorm/2026-10-14-logo-animations/DepartureMono.woff2 public/fonts/DepartureMono-Regular.woff2
cp docs/brainstorm/2026-10-14-logo-animations/DepartureMono-LICENSE.txt public/fonts/DepartureMono-LICENSE.txt
git rm -q src/scripts/cursor-trail.ts src/assets/pixel-perfection-logo.svg public/fonts/made_dillan.otf
```

- [ ] **Step 3: Write the failing SEO test**

`src/lib/seo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { personJsonLd, SITE } from './seo';

describe('personJsonLd', () => {
  it('describes Mikkel as a Person with the Pixel Perfection brand', () => {
    const ld = personJsonLd({ github: 'https://github.com/ExManubis' }) as Record<string, any>;
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Mikkel Jørgensen');
    expect(ld.jobTitle).toBe('Design // AI Engineer');
    expect(ld.worksFor.name).toBe('smallclaims');
    expect(ld.brand.name).toBe('Pixel Perfection');
    expect(ld.url).toBe(SITE.url);
  });

  it('only lists social profiles that have a URL', () => {
    const ld = personJsonLd({ github: 'https://github.com/ExManubis', linkedin: 'https://linkedin.com/in/x' }) as Record<string, any>;
    expect(ld.sameAs).toEqual(['https://github.com/ExManubis', 'https://linkedin.com/in/x']);
  });

  it('has no business-listing fields from the old site', () => {
    const ld = personJsonLd() as Record<string, any>;
    expect(ld.taxID).toBeUndefined();
    expect(ld.priceRange).toBeUndefined();
  });
});
```

- [ ] **Step 4: Run it to see it fail**

Run: `npx vitest run src/lib/seo.test.ts`
Expected: FAIL — `Failed to resolve import "./seo"`.

- [ ] **Step 5: Implement `site.ts`, `seo.ts`, `report.ts`, `analytics.ts`**

`src/data/site.ts`:

```ts
export const EMAIL = 'sales@pixelperfection.dev';

/** X and LinkedIn are added once Mikkel supplies the URLs (spec §15). Links without a URL are not rendered. */
export const social: { github: string; x?: string; linkedin?: string } = {
  github: 'https://github.com/ExManubis',
};

export function footerLinks(s = social): { label: string; href: string }[] {
  const links: { label: string; href?: string }[] = [
    { label: EMAIL, href: `mailto:${EMAIL}` },
    { label: 'GitHub', href: s.github },
    { label: 'X', href: s.x },
    { label: 'LinkedIn', href: s.linkedin },
  ];
  return links.filter((l): l is { label: string; href: string } => Boolean(l.href));
}
```

`src/lib/seo.ts`:

```ts
import { EMAIL, social as defaultSocial } from '../data/site';

export const SITE = {
  url: 'https://pixelperfection.dev',
  title: 'Pixel Perfection: Mikkel Jørgensen',
  motto: "Things I make when no one's asking.",
  description:
    "Things I make when no one's asking. The after-hours work of Mikkel Jørgensen, Design // AI Engineer in Copenhagen.",
};

export function personJsonLd(s: { github?: string; x?: string; linkedin?: string } = defaultSocial): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Mikkel Jørgensen',
    jobTitle: 'Design // AI Engineer',
    worksFor: { '@type': 'Organization', name: 'smallclaims', url: 'https://smallclaims.ai' },
    url: SITE.url,
    email: `mailto:${EMAIL}`,
    address: { '@type': 'PostalAddress', addressLocality: 'Copenhagen', addressCountry: 'DK' },
    brand: { '@type': 'Brand', name: 'Pixel Perfection', logo: `${SITE.url}/favicon.svg` },
    sameAs: [s.github, s.x, s.linkedin].filter(Boolean),
  };
}
```

`src/lib/report.ts`:

```ts
/** Report an error to Sentry without making Sentry a hard dependency of the module that failed. */
export function reportError(err: unknown): void {
  console.error(err);
  import('@sentry/astro').then((Sentry) => Sentry.captureException(err)).catch(() => {});
}
```

`src/lib/analytics.ts` — first check the SDK's exports:

Run: `grep -n "track" node_modules/@amplitude/unified/lib/esm/index.d.ts`
Expected: a line exporting `track`. If it is absent, replace `amplitude.track(event)` below with `amplitude.analytics.track(event)` (the unified SDK nests the analytics client under `analytics`).

```ts
import * as amplitude from '@amplitude/unified';

export function initAnalytics(): void {
  amplitude.initAll('2980fa258547c36f475afed98d75e2b4', {
    serverZone: 'EU',
    analytics: { autocapture: true },
    sessionReplay: { sampleRate: 1 },
  });
}

export function track(event: string): void {
  try {
    amplitude.track(event);
  } catch {
    // analytics must never break the page
  }
}
```

- [ ] **Step 6: Run the test to see it pass**

Run: `npx vitest run src/lib/seo.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Rewrite the global stylesheet**

`src/styles/global.css` (replace the whole file):

```css
@import "tailwindcss";

@font-face {
  font-family: 'Departure Mono';
  src: url('/fonts/DepartureMono-Regular.woff2') format('woff2');
  font-display: swap;
}

@theme {
  --color-bg: #0A0A0A;
  --color-fg: #EDEDED;
  --color-muted: #7A7A7A;
  --color-subtle: #2A2A2A;
  --font-mono: 'Departure Mono', ui-monospace, Menlo, monospace;
}

@layer base {
  html {
    background: var(--color-bg);
    color: var(--color-fg);
    font-family: var(--font-mono);
    font-size: 16px;
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
  }
  body { margin: 0; }
  a { color: inherit; }
  ::selection { background: var(--color-fg); color: var(--color-bg); }
  :focus-visible { outline: 1px solid var(--color-fg); outline-offset: 2px; }
  [id] { scroll-margin-top: 96px; }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
}

@layer components {
  .label { font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; }
  .link {
    color: var(--color-muted);
    text-decoration: underline dotted;
    text-underline-offset: 4px;
    transition: color 0.2s;
    background: none; border: 0; padding: 0; font: inherit; cursor: pointer;
  }
  .link:hover, .link:focus-visible { color: var(--color-fg); }
  .js .js-hide { display: none; }
  html:not(.js) .no-js-hide { display: none; }
}
```

- [ ] **Step 8: Rewrite the layout**

`src/layouts/Layout.astro`:

```astro
---
import '../styles/global.css';
import { SITE, personJsonLd } from '../lib/seo';
---

<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta name="generator" content={Astro.generator} />
		<script is:inline>document.documentElement.classList.add('js');</script>
		<title>{SITE.title}</title>
		<meta name="description" content={SITE.description} />
		<link rel="canonical" href={SITE.url} />
		<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
		<link rel="preload" href="/fonts/DepartureMono-Regular.woff2" as="font" type="font/woff2" crossorigin />
		<meta name="theme-color" content="#0A0A0A" />

		<meta property="og:type" content="website" />
		<meta property="og:url" content={SITE.url} />
		<meta property="og:site_name" content="Pixel Perfection" />
		<meta property="og:title" content={SITE.title} />
		<meta property="og:description" content={SITE.description} />
		<meta property="og:locale" content="en_US" />
		<meta name="twitter:card" content="summary_large_image" />

		<script type="application/ld+json" set:html={JSON.stringify(personJsonLd())} />
	</head>
	<body class="bg-bg text-fg">
		<slot />
		<script>
			import { initAnalytics } from '../lib/analytics';
			initAnalytics();
		</script>
	</body>
</html>
```

- [ ] **Step 9: Write the footer and the page skeleton**

`src/components/global/Footer.astro`:

```astro
---
import { footerLinks } from '../../data/site';
---

<footer id="contact" class="label mx-auto flex max-w-[960px] flex-col gap-6 px-6 pt-10 pb-16 sm:flex-row sm:items-center sm:justify-between">
	<h2 class="sr-only">Contact</h2>
	<ul class="flex flex-wrap gap-x-8 gap-y-3">
		{footerLinks().map((l) => (
			<li><a class="link" href={l.href}>{l.label}</a></li>
		))}
	</ul>
	<p class="text-muted">© 2026 Pixel Perfection</p>
</footer>
```

`src/components/global/Navigation.astro` (skeleton; the logo canvas arrives in Task 8):

```astro
<header class="fixed inset-x-0 top-0 z-50 bg-bg/90 backdrop-blur-sm">
	<nav aria-label="Main" class="label mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6">
		<a href="#top" class="flex items-center gap-3 text-fg no-underline">
			<span class="max-[480px]:sr-only">Pixel Perfection</span>
		</a>
		<ul class="flex gap-6 sm:gap-8">
			<li><a class="link no-underline" href="#work">Work</a></li>
			<li><a class="link no-underline" href="#about">About</a></li>
			<li><a class="link no-underline" href="#contact">Contact</a></li>
		</ul>
	</nav>
</header>
```

`src/components/index/Hero.astro` (skeleton; the logo arrives in Task 7):

```astro
---
import { SITE } from '../../lib/seo';
---

<section id="top" class="flex min-h-svh flex-col items-center justify-center gap-10 px-6 pt-20">
	<p class="text-center text-[20px] leading-[1.4]">{SITE.motto}</p>
</section>
```

`src/pages/index.astro`:

```astro
---
import Layout from '../layouts/Layout.astro';
import Navigation from '../components/global/Navigation.astro';
import Hero from '../components/index/Hero.astro';
import Footer from '../components/global/Footer.astro';
---

<Layout>
	<Navigation />
	<main class="flex flex-col gap-[140px] sm:gap-[240px]">
		<h1 class="sr-only">Pixel Perfection</h1>
		<Hero />
	</main>
	<Footer />
</Layout>
```

- [ ] **Step 10: Verify build and look**

Run: `npm test && npm run build`
Expected: tests pass; build completes with no errors (a Sentry auth-token warning is fine).

Run: `npm run dev`, open `http://localhost:4321`.
Expected: near-black page, Departure Mono everywhere, fixed nav with `PIXEL PERFECTION` + three links, the motto centred, footer with email + GitHub. No brown, no cursor trail, no Google Fonts request in the Network tab.

- [ ] **Step 11: Commit**

```bash
git add -A package.json package-lock.json vitest.config.ts src public
git commit -m "feat: new foundation — mono tokens, Departure Mono, English SEO, page skeleton"
```

---

### Task 2: Shared animation scheduler

**Files:**
- Create: `src/lib/motion/scheduler.ts`, `src/lib/motion/scheduler.test.ts`

**Interfaces:**
- Consumes: `reportError` (Task 1).
- Produces:
  - `interface Animation { el?: Element; fps?: number; frame(t: number, dt: number): void }` — `t` = page time in seconds (`performance.now()/1000`), `dt` = seconds since this animation last ran, clamped to `[0, 0.1]`, `0` on first run or after resuming.
  - `interface Handle { stop(): void }`
  - `createScheduler(deps: SchedulerDeps): { register(a: Animation): Handle }` with `SchedulerDeps = { raf(cb: (nowMs: number) => void): void; observe(el: Element, onChange: (visible: boolean) => void): () => void; onError(err: unknown): void }`
  - `register(a: Animation): Handle` — default browser scheduler.
  - `prefersReducedMotion(): boolean`

- [ ] **Step 1: Write the failing tests**

`src/lib/motion/scheduler.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createScheduler } from './scheduler';

function harness() {
  let queued: ((now: number) => void)[] = [];
  const watchers = new Map<Element, (v: boolean) => void>();
  const onError = vi.fn();
  const s = createScheduler({
    raf: (cb) => { queued.push(cb); },
    observe: (el, cb) => { watchers.set(el, cb); return () => watchers.delete(el); },
    onError,
  });
  const flush = (now: number) => { const q = queued; queued = []; q.forEach((cb) => cb(now)); };
  return { s, flush, watchers, onError, pending: () => queued.length };
}

describe('scheduler', () => {
  it('calls frame on every tick with page time in seconds', () => {
    const h = harness();
    const frame = vi.fn();
    h.s.register({ frame });
    h.flush(1000);
    h.flush(1016);
    expect(frame).toHaveBeenCalledTimes(2);
    expect(frame.mock.calls[0]).toEqual([1, 0]);
    expect(frame.mock.calls[1][0]).toBeCloseTo(1.016);
    expect(frame.mock.calls[1][1]).toBeCloseTo(0.016);
  });

  it('caps the frame rate', () => {
    const h = harness();
    const frame = vi.fn();
    h.s.register({ frame, fps: 30 });
    for (let i = 0; i < 6; i++) h.flush(1000 + i * 16.7);
    expect(frame).toHaveBeenCalledTimes(3);
  });

  it('pauses while its element is off-screen and resumes with dt = 0', () => {
    const h = harness();
    const el = {} as Element;
    const frame = vi.fn();
    h.s.register({ el, frame });
    h.watchers.get(el)!(true);
    h.flush(1000);
    h.watchers.get(el)!(false);
    h.flush(1016);
    h.flush(5000);
    expect(frame).toHaveBeenCalledTimes(1);
    h.watchers.get(el)!(true);
    h.flush(9000);
    expect(frame).toHaveBeenCalledTimes(2);
    expect(frame.mock.calls[1][1]).toBe(0);
  });

  it('clamps dt to 0.1 s after a long gap (e.g. a hidden tab)', () => {
    const h = harness();
    const frame = vi.fn();
    h.s.register({ frame });
    h.flush(1000);
    h.flush(61000);
    expect(frame.mock.calls[1][1]).toBe(0.1);
  });

  it('stops a failing animation, reports it, and keeps the others running', () => {
    const h = harness();
    const bad = vi.fn(() => { throw new Error('boom'); });
    const good = vi.fn();
    h.s.register({ frame: bad });
    h.s.register({ frame: good });
    h.flush(1000);
    h.flush(1016);
    expect(bad).toHaveBeenCalledTimes(1);
    expect(good).toHaveBeenCalledTimes(2);
    expect(h.onError).toHaveBeenCalledTimes(1);
  });

  it('stops requesting frames when nothing is registered', () => {
    const h = harness();
    const handle = h.s.register({ frame: () => {} });
    h.flush(1000);
    handle.stop();
    h.flush(1016);
    expect(h.pending()).toBe(0);
  });
});
```

- [ ] **Step 2: Run to see failure**

Run: `npx vitest run src/lib/motion/scheduler.test.ts`
Expected: FAIL — cannot resolve `./scheduler`.

- [ ] **Step 3: Implement**

`src/lib/motion/scheduler.ts`:

```ts
import { reportError } from '../report';

export interface Animation {
  /** Element whose visibility gates the animation; omit to run whenever the page is visible. */
  el?: Element;
  /** Maximum frames per second (default 60). */
  fps?: number;
  /** t: page time in seconds. dt: seconds since this animation last ran, clamped to 0.1 (0 on first run/resume). */
  frame(t: number, dt: number): void;
}

export interface Handle {
  stop(): void;
}

export interface SchedulerDeps {
  raf(cb: (nowMs: number) => void): void;
  observe(el: Element, onChange: (visible: boolean) => void): () => void;
  onError(err: unknown): void;
}

interface Entry {
  a: Animation;
  visible: boolean;
  last: number | null;
  unobserve: () => void;
}

export function createScheduler(deps: SchedulerDeps) {
  const entries = new Set<Entry>();
  let running = false;

  const remove = (e: Entry) => {
    e.unobserve();
    entries.delete(e);
  };

  const tick = (now: number) => {
    for (const e of [...entries]) {
      if (!e.visible) {
        e.last = null;
        continue;
      }
      const minGap = 1000 / (e.a.fps ?? 60) - 1;
      if (e.last !== null && now - e.last < minGap) continue;
      const dt = e.last === null ? 0 : Math.min((now - e.last) / 1000, 0.1);
      e.last = now;
      try {
        e.a.frame(now / 1000, dt);
      } catch (err) {
        remove(e);
        deps.onError(err);
      }
    }
    if (entries.size) deps.raf(tick);
    else running = false;
  };

  return {
    register(a: Animation): Handle {
      const e: Entry = { a, visible: !a.el, last: null, unobserve: () => {} };
      if (a.el) e.unobserve = deps.observe(a.el, (v) => { e.visible = v; });
      entries.add(e);
      if (!running) {
        running = true;
        deps.raf(tick);
      }
      return { stop: () => remove(e) };
    },
  };
}

let browser: ReturnType<typeof createScheduler> | null = null;

function browserScheduler() {
  if (browser) return browser;
  const callbacks = new Map<Element, (v: boolean) => void>();
  const io = new IntersectionObserver((records) => {
    for (const r of records) callbacks.get(r.target)?.(r.isIntersecting);
  });
  browser = createScheduler({
    raf: (cb) => { requestAnimationFrame(cb); },
    observe: (el, cb) => {
      callbacks.set(el, cb);
      io.observe(el);
      return () => { io.unobserve(el); callbacks.delete(el); };
    },
    onError: reportError,
  });
  return browser;
}

export function register(a: Animation): Handle {
  return browserScheduler().register(a);
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run src/lib/motion/scheduler.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/motion
git commit -m "feat: shared animation scheduler with visibility pausing and fps caps"
```

---

### Task 3: Decode logic — RNG, frame layout, text decode, scroll progress

**Files:**
- Create: `src/lib/decode/rng.ts`, `src/lib/decode/frame.ts`, `src/lib/decode/text.ts`, `src/lib/decode/rng.test.ts`, `src/lib/decode/frame.test.ts`, `src/lib/decode/text.test.ts`

**Interfaces:**
- Produces:
  - `type Rng = () => number`; `mulberry32(seed: number): Rng`; `hashString(s: string): number`; `GLYPHS: string`; `glyph(rng: Rng): string` (`rng.ts`)
  - `interface FrameCell { x: number; y: number; ch: string; seed: number }`, `interface FrameLayout { cols: number; rows: number; cells: FrameCell[] }`, `layoutFrame(cols, rows, label, rng): FrameLayout`, `renderFrame(layout, p, rng): string`, `scrollProgress(top, bottom, viewportHeight): number` (`frame.ts`)
  - `makeTextSeeds(text: string, rng: Rng): number[]`, `decodeText(text: string, seeds: number[], p: number, rng: Rng): string` (`text.ts`)

- [ ] **Step 1: Write the failing tests**

`src/lib/decode/rng.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { GLYPHS, glyph, hashString, mulberry32 } from './rng';

describe('rng', () => {
  it('is deterministic for a seed and stays in [0, 1)', () => {
    const a = mulberry32(42), b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('hashes strings stably', () => {
    expect(hashString('01 / CLAUDEWITZ')).toBe(hashString('01 / CLAUDEWITZ'));
    expect(hashString('a')).not.toBe(hashString('b'));
  });

  it('picks glyphs from the glyph set', () => {
    const r = mulberry32(1);
    for (let i = 0; i < 50; i++) expect(GLYPHS).toContain(glyph(r));
  });
});
```

`src/lib/decode/frame.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mulberry32 } from './rng';
import { layoutFrame, renderFrame, scrollProgress } from './frame';

describe('layoutFrame + renderFrame', () => {
  it('draws a complete box with the label in the top border at p = 1', () => {
    const layout = layoutFrame(8, 3, 'AB', mulberry32(1));
    expect(renderFrame(layout, 1, mulberry32(2))).toBe('┌─ AB ─┐\n│      │\n└──────┘');
  });

  it('draws nothing at p = 0', () => {
    const layout = layoutFrame(8, 3, 'AB', mulberry32(1));
    expect(renderFrame(layout, 0, mulberry32(2))).toBe('        \n        \n        ');
  });

  it('is deterministic for the same seeds', () => {
    const a = renderFrame(layoutFrame(20, 6, '01 / X', mulberry32(9)), 0.5, mulberry32(3));
    const b = renderFrame(layoutFrame(20, 6, '01 / X', mulberry32(9)), 0.5, mulberry32(3));
    expect(a).toBe(b);
  });

  it('truncates a label that is too long for a narrow frame and keeps the corners', () => {
    const top = renderFrame(layoutFrame(10, 3, '01 / CLAUDEWITZ', mulberry32(1)), 1, mulberry32(2)).split('\n')[0];
    expect(top).toHaveLength(10);
    expect(top.startsWith('┌─')).toBe(true);
    expect(top.endsWith('─┐')).toBe(true);
  });

  it('returns an empty layout for degenerate sizes without throwing', () => {
    for (const [c, r] of [[0, 0], [3, 10], [10, 1], [-5, -5]]) {
      const layout = layoutFrame(c, r, 'X', mulberry32(1));
      expect(layout.cells).toEqual([]);
      expect(() => renderFrame(layout, 1, mulberry32(1))).not.toThrow();
    }
  });
});

describe('scrollProgress', () => {
  const vh = 1000;
  it('is 0 below the viewport', () => expect(scrollProgress(1000, 1600, vh)).toBe(0));
  it('is 1 once the top reaches 72 % of the viewport', () => expect(scrollProgress(720, 1320, vh)).toBe(1));
  it('ramps in from the bottom', () => expect(scrollProgress(860, 1460, vh)).toBeCloseTo(0.5));
  it('stays 1 while a tall section covers the whole viewport', () => expect(scrollProgress(-500, 1500, vh)).toBe(1));
  it('ramps out through the top 30 %', () => expect(scrollProgress(-600, 150, vh)).toBeCloseTo(0.5));
  it('is 0 above the viewport', () => expect(scrollProgress(-900, -1, vh)).toBe(0));
});
```

`src/lib/decode/text.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mulberry32 } from './rng';
import { decodeText, makeTextSeeds } from './text';

const TEXT = "Things I make\nwhen no one's asking.";

describe('decodeText', () => {
  it('returns the text exactly at p = 1', () => {
    const seeds = makeTextSeeds(TEXT, mulberry32(1));
    expect(decodeText(TEXT, seeds, 1, mulberry32(2))).toBe(TEXT);
  });

  it('keeps whitespace and line breaks at p = 0 and blanks everything else', () => {
    const seeds = makeTextSeeds(TEXT, mulberry32(1));
    const out = decodeText(TEXT, seeds, 0, mulberry32(2));
    expect(out).toHaveLength(TEXT.length);
    expect(out.split('\n')).toHaveLength(2);
    expect(out.replace(/\s/g, '')).toBe('');
  });

  it('decodes left to right overall', () => {
    const seeds = makeTextSeeds('abcdefghijklmnopqrstuvwxyz', mulberry32(5));
    const mid = decodeText('abcdefghijklmnopqrstuvwxyz', seeds, 0.5, mulberry32(6));
    expect(mid.startsWith('abc')).toBe(true);
    expect(mid.endsWith('xyz')).toBe(false);
  });
});
```

- [ ] **Step 2: Run to see failure**

Run: `npx vitest run src/lib/decode`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/lib/decode/rng.ts`:

```ts
export type Rng = () => number;

/** Small, fast, seedable PRNG so decode output is reproducible in tests. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a: a stable seed per frame label. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const GLYPHS = '!<>-_\\/[]{}=+*^?#%&$@~';

export const glyph = (rng: Rng): string => GLYPHS[Math.floor(rng() * GLYPHS.length)];
```

`src/lib/decode/frame.ts`:

```ts
import { glyph, type Rng } from './rng';

export interface FrameCell { x: number; y: number; ch: string; seed: number }
export interface FrameLayout { cols: number; rows: number; cells: FrameCell[] }

/** Perimeter cells of a box-drawing frame, clockwise from the top-left, each with a decode seed. */
export function layoutFrame(cols: number, rows: number, label: string, rng: Rng): FrameLayout {
  cols = Math.max(0, Math.floor(cols));
  rows = Math.max(0, Math.floor(rows));
  if (cols < 4 || rows < 2) return { cols, rows, cells: [] };

  const pos: [number, number][] = [];
  for (let x = 0; x < cols; x++) pos.push([x, 0]);
  for (let y = 1; y < rows; y++) pos.push([cols - 1, y]);
  for (let x = cols - 2; x >= 0; x--) pos.push([x, rows - 1]);
  for (let y = rows - 2; y > 0; y--) pos.push([0, y]);

  const text = ` ${label} `.slice(0, cols - 4);
  const ch = (x: number, y: number): string => {
    if (y === 0 && x >= 2 && x < 2 + text.length) return text[x - 2];
    if (y === 0) return x === 0 ? '┌' : x === cols - 1 ? '┐' : '─';
    if (y === rows - 1) return x === 0 ? '└' : x === cols - 1 ? '┘' : '─';
    return '│';
  };
  const n = pos.length;
  return { cols, rows, cells: pos.map(([x, y], i) => ({ x, y, ch: ch(x, y), seed: 0.6 * (i / n) + 0.25 * rng() })) };
}

export function renderFrame(layout: FrameLayout, p: number, rng: Rng): string {
  const grid = Array.from({ length: layout.rows }, () => new Array<string>(layout.cols).fill(' '));
  for (const c of layout.cells) grid[c.y][c.x] = p >= c.seed + 0.12 ? c.ch : p >= c.seed ? glyph(rng) : ' ';
  return grid.map((r) => r.join('')).join('\n');
}

/**
 * Decode progress for a section from its bounding box:
 * 0 → 1 while its top moves from the viewport bottom to 72 % height,
 * 1 → 0 while its bottom leaves through the top 30 %.
 */
export function scrollProgress(top: number, bottom: number, vh: number): number {
  const enter = (vh - top) / (vh * 0.28);
  const exit = bottom / (vh * 0.3);
  return Math.max(0, Math.min(1, enter, exit));
}
```

`src/lib/decode/text.ts`:

```ts
import { glyph, type Rng } from './rng';

/** One seed per character: roughly left to right, with jitter. */
export function makeTextSeeds(text: string, rng: Rng): number[] {
  const chars = Array.from(text);
  const n = Math.max(1, chars.length - 1);
  return chars.map((_, i) => 0.7 * (i / n) + 0.2 * rng());
}

/** Whitespace never scrambles; other characters go blank → random glyph → final as p passes their seed. */
export function decodeText(text: string, seeds: number[], p: number, rng: Rng): string {
  return Array.from(text)
    .map((c, i) => {
      if (/\s/.test(c)) return c;
      const s = seeds[i] ?? 0;
      return p >= s + 0.1 ? c : p >= s ? glyph(rng) : ' ';
    })
    .join('');
}
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run src/lib/decode`
Expected: PASS (all tests in the three files).

- [ ] **Step 5: Commit**

```bash
git add src/lib/decode
git commit -m "feat: decode frame and text logic with seeded randomness and scroll progress"
```

---

### Task 4: ANSI headers, DecodeFrame component, About text section

**Files:**
- Create: `src/lib/type/figlet.ts`, `src/lib/type/figlet.test.ts`, `src/lib/type/fit.ts`, `src/lib/decode/mount.ts`, `src/components/type/AsciiHeader.astro`, `src/components/frame/DecodeFrame.astro`, `src/components/about/About.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `register`, `prefersReducedMotion` (Task 2); `layoutFrame`, `renderFrame`, `scrollProgress`, `makeTextSeeds`, `decodeText`, `mulberry32`, `hashString` (Task 3); `reportError` (Task 1).
- Produces: `ansiShadow(text: string): string`; `fitPre(el: HTMLElement, maxPx: number): void`; `mountDecodeFrames(root?: ParentNode): void`; `<AsciiHeader text />` renders `<pre class="ascii-header" data-ascii-header aria-hidden="true">`; `<DecodeFrame label brand?>` renders `<div class="decode-frame" data-decode-frame data-label data-branded? style="--brand…">` with a `<pre class="decode-frame__border">` and the slot inside `.decode-frame__content`; it sets `data-active` while `p > 0.5`.

- [ ] **Step 1: Write the failing figlet test**

`src/lib/type/figlet.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ansiShadow } from './figlet';

describe('ansiShadow', () => {
  it('renders ANSI Shadow with trailing whitespace and blank lines removed', () => {
    expect(ansiShadow('PP')).toBe(
      [
        '██████╗ ██████╗',
        '██╔══██╗██╔══██╗',
        '██████╔╝██████╔╝',
        '██╔═══╝ ██╔═══╝',
        '██║     ██║',
        '╚═╝     ╚═╝',
      ].join('\n'),
    );
  });

  it('upper-cases its input', () => {
    expect(ansiShadow('about')).toBe(ansiShadow('ABOUT'));
  });
});
```

- [ ] **Step 2: Run to see failure**

Run: `npx vitest run src/lib/type/figlet.test.ts`
Expected: FAIL — `./figlet` not found.

- [ ] **Step 3: Implement `figlet.ts` and `fit.ts`**

`src/lib/type/figlet.ts`:

```ts
import figlet from 'figlet';

/** ANSI Shadow FIGlet art, generated at build time. */
export function ansiShadow(text: string): string {
  const lines = figlet
    .textSync(text.toUpperCase(), { font: 'ANSI Shadow' })
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''));
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n');
}
```

`src/lib/type/fit.ts`:

```ts
/** Shrink a <pre> so its longest line fits its width; never larger than maxPx. */
export function fitPre(el: HTMLElement, maxPx: number): void {
  el.style.fontSize = `${maxPx}px`;
  const ratio = el.clientWidth / Math.max(1, el.scrollWidth);
  if (ratio < 1) el.style.fontSize = `${(maxPx * ratio).toFixed(2)}px`;
}
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run src/lib/type/figlet.test.ts`
Expected: PASS (2 tests). If the first test fails only on the exact art, print `ansiShadow('PP')` with `npx tsx -e "import('./src/lib/type/figlet.ts').then(m=>console.log(m.ansiShadow('PP')))"`, confirm it is the ANSI Shadow "PP" shown above, and fix the implementation (not the expectation) if lines carry trailing spaces.

- [ ] **Step 5: Implement the frame mount**

`src/lib/decode/mount.ts`:

```ts
import { prefersReducedMotion, register } from '../motion/scheduler';
import { reportError } from '../report';
import { fitPre } from '../type/fit';
import { layoutFrame, renderFrame, scrollProgress, type FrameLayout } from './frame';
import { hashString, mulberry32 } from './rng';
import { decodeText, makeTextSeeds } from './text';

const LINE_PX = 16;
const HEADER_MAX_PX = 14;

function charWidth(pre: HTMLElement): number {
  const probe = document.createElement('span');
  probe.textContent = '──────────';
  pre.appendChild(probe);
  const w = probe.getBoundingClientRect().width / 10;
  probe.remove();
  return w > 0 ? w : 8;
}

function mountOne(el: HTMLElement): void {
  const border = el.querySelector<HTMLElement>('.decode-frame__border');
  if (!border) return;
  const label = el.dataset.label ?? '';
  const rng = mulberry32(hashString(label));
  const headers = [...el.querySelectorAll<HTMLElement>('[data-ascii-header]')].map((h) => ({
    el: h,
    text: h.textContent ?? '',
    seeds: [] as number[],
  }));
  let layout: FrameLayout = { cols: 0, rows: 0, cells: [] };
  let lastP = -1;

  const relayout = () => {
    const cw = charWidth(border);
    layout = layoutFrame(el.clientWidth / cw, el.clientHeight / LINE_PX, label, rng);
    for (const h of headers) {
      h.el.textContent = h.text;
      fitPre(h.el, HEADER_MAX_PX);
      h.seeds = makeTextSeeds(h.text, rng);
    }
    lastP = -1;
  };
  relayout();
  new ResizeObserver(relayout).observe(el);
  document.fonts?.ready.then(relayout).catch(() => {});

  const reduced = prefersReducedMotion();
  register({
    el,
    fps: 30,
    frame: () => {
      const r = el.getBoundingClientRect();
      const p = reduced ? 1 : scrollProgress(r.top, r.bottom, window.innerHeight);
      if ((p <= 0 || p >= 1) && p === lastP) return;
      lastP = p;
      border.textContent = renderFrame(layout, p, rng);
      for (const h of headers) h.el.textContent = decodeText(h.text, h.seeds, p, rng);
      el.toggleAttribute('data-active', p > 0.5);
    },
  });
}

export function mountDecodeFrames(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-decode-frame]:not([data-mounted])').forEach((el) => {
    el.dataset.mounted = '';
    try {
      mountOne(el);
    } catch (err) {
      reportError(err);
    }
  });
}
```

- [ ] **Step 6: Write the components**

`src/components/type/AsciiHeader.astro`:

```astro
---
import { ansiShadow } from '../../lib/type/figlet';

interface Props { text: string }
const art = ansiShadow(Astro.props.text);
---

<pre class="ascii-header" data-ascii-header aria-hidden="true">{art}</pre>

<style>
	.ascii-header {
		margin: 0;
		font-size: 14px;
		line-height: 1;
		white-space: pre;
		overflow: hidden;
		color: var(--color-fg);
		transition: color 0.6s;
	}
</style>
```

`src/components/frame/DecodeFrame.astro`:

```astro
---
interface Props {
	label: string;
	brand?: { primary: string; secondary?: string };
}
const { label, brand } = Astro.props;
const style = brand ? `--brand: ${brand.primary};${brand.secondary ? ` --brand-2: ${brand.secondary};` : ''}` : undefined;
---

<div class="decode-frame" data-decode-frame data-label={label} data-branded={brand ? '' : undefined} style={style}>
	<pre class="decode-frame__border" aria-hidden="true"></pre>
	<div class="decode-frame__content"><slot /></div>
</div>

<script>
	import { mountDecodeFrames } from '../../lib/decode/mount';
	mountDecodeFrames();
</script>

<style>
	.decode-frame {
		position: relative;
		--frame-color: var(--color-subtle);
		border: 1px solid var(--color-subtle); /* no-JS fallback */
	}
	:global(.js) .decode-frame { border-color: transparent; }
	.decode-frame[data-active][data-branded] { --frame-color: var(--brand); }
	.decode-frame[data-active][data-branded] :global(.ascii-header) { color: var(--brand); }
	.decode-frame__border {
		position: absolute;
		inset: 0;
		margin: 0;
		font-size: 13px;
		line-height: 16px;
		white-space: pre;
		overflow: hidden;
		pointer-events: none;
		color: var(--frame-color);
		transition: color 0.6s;
	}
	.decode-frame__content { position: relative; padding: 48px 24px; }
	@media (min-width: 640px) { .decode-frame__content { padding: 64px 56px; } }
</style>
```

`src/components/about/About.astro` (text only; the portrait arrives in Task 11):

```astro
---
import DecodeFrame from '../frame/DecodeFrame.astro';
import AsciiHeader from '../type/AsciiHeader.astro';

interface Props { index: number }
const label = `${String(Astro.props.index).padStart(2, '0')} / ABOUT`;
---

<section id="about" aria-labelledby="about-title" class="mx-auto w-full max-w-[960px] px-6">
	<DecodeFrame label={label}>
		<h2 id="about-title" class="sr-only">About</h2>
		<div class="grid items-start gap-10 sm:grid-cols-[auto_1fr]">
			<div data-portrait-slot></div>
			<div class="min-w-0">
				<AsciiHeader text="About" />
				<p class="mt-6 max-w-[34rem] text-[16px] leading-[1.6]">
					I'm Mikkel Jørgensen, Design // AI Engineer at <a class="link" href="https://smallclaims.ai">smallclaims</a> in
					Copenhagen. Pixel Perfection is what happens after hours: tools I wanted to exist, made with more care than anyone
					asked for.
				</p>
			</div>
		</div>
	</DecodeFrame>
</section>
```

Modify `src/pages/index.astro` — import About and render it after `<Hero />`:

```astro
---
import Layout from '../layouts/Layout.astro';
import Navigation from '../components/global/Navigation.astro';
import Hero from '../components/index/Hero.astro';
import About from '../components/about/About.astro';
import Footer from '../components/global/Footer.astro';
---

<Layout>
	<Navigation />
	<main class="flex flex-col gap-[140px] sm:gap-[240px]">
		<h1 class="sr-only">Pixel Perfection</h1>
		<Hero />
		<About index={1} />
	</main>
	<Footer />
</Layout>
```

(`index={1}` becomes `projects.length + 1` in Task 10.)

- [ ] **Step 7: Verify in the browser**

Run: `npm test && npm run dev`, open `http://localhost:4321`, scroll down to About.
Expected:
- The box frame decodes in clockwise as the section rises, `01 / ABOUT` sits in the top border, and the `ABOUT` ANSI header decodes with it; scrolling back reverses it.
- At 390 px wide (DevTools device toolbar), the header shrinks to fit on one line per row and the frame still closes at all four corners.
- With JavaScript disabled, a thin grey CSS border and the static header show instead.

- [ ] **Step 8: Commit**

```bash
git add src/lib/type src/lib/decode/mount.ts src/components/type src/components/frame src/components/about src/pages/index.astro
git commit -m "feat: decode frames, ANSI Shadow headers and the About text section"
```

---

### Task 5: 3D core — quaternions, SDF geometry, logo pose

**Files:**
- Create: `src/lib/render/quat.ts`, `src/lib/render/sdf.ts`, `src/lib/render/pose.ts`, `src/lib/render/quat.test.ts`, `src/lib/render/pose.test.ts`

**Interfaces:**
- Produces:
  - `type Quat = readonly [number, number, number, number]` (w, x, y, z); `type Vec3 = readonly [number, number, number]`; `qMul`, `qConj`, `qAxis(axis: Vec3, angle): Quat`, `qRot(q, v: Vec3): [number, number, number]`, `qSlerp(a, b, t): Quat` (`quat.ts`)
  - `interface Pose { qCam: Quat; qCube: Quat; S: number; w: number }`; `type CameraMode = 'orbit' | 'sway'`; `CYCLE = 7`; `POSE_OFFSET = 2.4`; `LOCK_CENTRE = 4.85`; `lockWeight(t): number`; `pose(t, mode?, tighten?): Pose`; `logoTime(pageSeconds): number` (`pose.ts`)
  - `interface LogoGeom { arm: number; thickness: number; cube: number; bevel: number; span: number; flat?: boolean; noArms?: boolean }`; `HERO_GEOM`; `NAV_CUBE_GEOM`; `sdBox(...)`; `makeLogoSdf(g: LogoGeom, p: Pose): (x: number, y: number, z: number) => number` (`sdf.ts`)
- `qCam` rotates object space into camera/world space (camera looks along +z, y up). `qCube` rotates the cube's local space into object space.

- [ ] **Step 1: Write the failing tests**

`src/lib/render/quat.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { qAxis, qConj, qMul, qRot, qSlerp } from './quat';

const close = (a: readonly number[], b: readonly number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 9));

describe('quaternions', () => {
  it('rotates 90° about y: +x → -z', () => close(qRot(qAxis([0, 1, 0], Math.PI / 2), [1, 0, 0]), [0, 0, -1]));
  it('conjugate undoes a rotation', () => {
    const q = qAxis([0.3, 1, 0.2], 1.1);
    close(qRot(qConj(q), qRot(q, [0.2, -0.5, 0.9])), [0.2, -0.5, 0.9]);
  });
  it('composes left-to-right as applied right-to-left', () => {
    const a = qAxis([0, 1, 0], 0.7), b = qAxis([1, 0, 0], -0.4), v = [0.1, 0.2, 0.3] as const;
    close(qRot(qMul(a, b), v), qRot(a, qRot(b, v)));
  });
  it('slerp hits both ends', () => {
    const a = qAxis([0, 1, 0], 0.2), b = qAxis([1, 0, 0], 1.3);
    close(qSlerp(a, b, 0), a);
    close(qSlerp(a, b, 1), b);
  });
});
```

`src/lib/render/pose.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { qMul, qRot } from './quat';
import { CYCLE, LOCK_CENTRE, lockWeight, logoTime, pose, POSE_OFFSET } from './pose';

const corners = (t: number) => {
  const { qCam } = pose(t, 'orbit');
  const pts: [number, number][] = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    const w = qRot(qCam, [x, y, z]);
    pts.push([w[0], w[1]]);
  }
  return pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
};

describe('lockWeight', () => {
  it('is fully locked at the lock centre, every cycle', () => {
    expect(lockWeight(LOCK_CENTRE)).toBe(1);
    expect(lockWeight(LOCK_CENTRE + CYCLE)).toBe(1);
  });
  it('is released early in the cycle', () => expect(lockWeight(1)).toBe(0));
  it('eases in', () => {
    const w = lockWeight(3.95);
    expect(w).toBeGreaterThan(0);
    expect(w).toBeLessThan(1);
  });
});

describe('pose', () => {
  it('turns the cube square to the viewer while locked', () => {
    const p = pose(LOCK_CENTRE, 'orbit');
    const front = qRot(qMul(p.qCam, p.qCube), [0, 0, -1]);
    [0, 0, -1].forEach((v, i) => expect(front[i]).toBeCloseTo(v, 6));
  });

  it('lands every focus lock on the same three-quarter view', () => {
    const a = corners(LOCK_CENTRE), b = corners(LOCK_CENTRE + CYCLE);
    a.forEach((pt, i) => { expect(pt[0]).toBeCloseTo(b[i][0], 6); expect(pt[1]).toBeCloseTo(b[i][1], 6); });
  });

  it('never shows the frame side-on at a lock (no two corners overlap)', () => {
    const pts = corners(LOCK_CENTRE);
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      expect(Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1])).toBeGreaterThan(0.2);
    }
  });

  it('tightens the brackets only when asked', () => {
    expect(pose(1, 'orbit').S).toBe(1);
    expect(pose(1, 'orbit', true).S).toBeCloseTo(1.08);
  });

  it('starts the logo clock offset so the first lock arrives about 1.5 s after load', () => {
    expect(logoTime(0)).toBe(POSE_OFFSET);
    expect(lockWeight(logoTime(1.9))).toBe(1);
  });
});
```

- [ ] **Step 2: Run to see failure**

Run: `npx vitest run src/lib/render`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/lib/render/quat.ts`:

```ts
export type Quat = readonly [number, number, number, number];
export type Vec3 = readonly [number, number, number];

export const qMul = (a: Quat, b: Quat): Quat => [
  a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
  a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
  a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
];

export const qConj = (q: Quat): Quat => [q[0], -q[1], -q[2], -q[3]];

export function qAxis(axis: Vec3, angle: number): Quat {
  const s = Math.sin(angle / 2) / Math.hypot(axis[0], axis[1], axis[2]);
  return [Math.cos(angle / 2), axis[0] * s, axis[1] * s, axis[2] * s];
}

export function qRot(q: Quat, v: Vec3): [number, number, number] {
  const p = qMul(qMul(q, [0, v[0], v[1], v[2]]), qConj(q));
  return [p[1], p[2], p[3]];
}

export function qSlerp(a: Quat, b: Quat, t: number): Quat {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  let bb: number[] = [...b];
  if (d < 0) { bb = bb.map((x) => -x); d = -d; }
  if (d > 0.9995) {
    const r = a.map((x, i) => x + (bb[i] - x) * t);
    const l = Math.hypot(r[0], r[1], r[2], r[3]);
    return [r[0] / l, r[1] / l, r[2] / l, r[3] / l];
  }
  const th = Math.acos(d), s = Math.sin(th);
  const k0 = Math.sin((1 - t) * th) / s, k1 = Math.sin(t * th) / s;
  return [a[0] * k0 + bb[0] * k1, a[1] * k0 + bb[1] * k1, a[2] * k0 + bb[2] * k1, a[3] * k0 + bb[3] * k1];
}
```

`src/lib/render/pose.ts`:

```ts
import { qAxis, qConj, qMul, qSlerp, type Quat } from './quat';

export interface Pose {
  /** object → world (camera looks along +z, y up) */
  qCam: Quat;
  /** cube local → object */
  qCube: Quat;
  /** bracket distance from the centre */
  S: number;
  /** focus-lock weight 0..1 */
  w: number;
}

export type CameraMode = 'orbit' | 'sway';

export const CYCLE = 7;
export const POSE_OFFSET = 2.4;
export const LOCK_CENTRE = 4.85;

const smooth = (x: number) => { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c); };

export function lockWeight(t: number): number {
  const c = ((t % CYCLE) + CYCLE) % CYCLE;
  return smooth((c - 3.6) / 0.7) * (1 - smooth((c - 6.1) / 0.7));
}

/** Logo clock from page time, offset so the first focus lock lands ≈ 1.5 s after load. */
export const logoTime = (pageSeconds: number): number => pageSeconds + POSE_OFFSET;

export function pose(t: number, mode: CameraMode = 'orbit', tighten = false): Pose {
  const k = mode === 'orbit' ? 1 : 0.6;
  const qCam =
    mode === 'orbit'
      ? // a quarter turn per cycle: the frame is symmetric, so every lock lands on the same three-quarter view
        qMul(
          qAxis([0, 1, 0], Math.PI / 4 + ((t - LOCK_CENTRE) * (Math.PI / 2)) / CYCLE),
          qAxis([1, 0, 0], -0.5 + Math.sin(((t - LOCK_CENTRE) * 2 * Math.PI) / CYCLE + Math.PI / 2) * 0.14),
        )
      : // gentle sway, never edge-on (nav logo)
        qMul(qAxis([0, 1, 0], Math.sin(t * 0.5) * 0.5), qAxis([1, 0, 0], -0.18 + Math.sin(t * 0.31) * 0.1));
  const w = lockWeight(t);
  const tumble = qMul(qAxis([0.35, 1, 0.2], t * k * 1.05), qAxis([1, 0, 0], 0.6));
  return { qCam, qCube: qSlerp(tumble, qConj(qCam), w), S: tighten ? 1 + 0.08 * (1 - w) : 1, w };
}
```

`src/lib/render/sdf.ts`:

```ts
import type { Pose } from './pose';
import { qConj, qRot } from './quat';

export interface LogoGeom {
  arm: number;
  thickness: number;
  cube: number;
  bevel: number;
  /** half-width of the view in world units */
  span: number;
  /** brackets only in the z = 0 plane (four corners, two arms each) */
  flat?: boolean;
  /** cube only */
  noArms?: boolean;
}

export const HERO_GEOM: LogoGeom = { arm: 0.38, thickness: 0.026, cube: 0.4, bevel: 0.03, span: 1.92 };
export const NAV_CUBE_GEOM: LogoGeom = { arm: 0, thickness: 0, cube: 0.34, bevel: 0, span: 1.32, flat: true, noArms: true };

export function sdBox(x: number, y: number, z: number, bx: number, by: number, bz: number): number {
  const qx = Math.abs(x) - bx, qy = Math.abs(y) - by, qz = Math.abs(z) - bz;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0);
}

/** Signed distance to the logo in object space: crop-mark arms at the cube corners plus the bevelled centre cube. */
export function makeLogoSdf(g: LogoGeom, p: Pose): (x: number, y: number, z: number) => number {
  const qi = qConj(p.qCube), S = p.S, A = g.arm, T = g.thickness, C = g.cube - g.bevel;
  return (x, y, z) => {
    const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
    let arms = Infinity;
    if (!g.noArms) {
      arms = g.flat
        ? Math.min(sdBox(ax - (S - A / 2), ay - S, z, A / 2, T, T), sdBox(ax - S, ay - (S - A / 2), z, T, A / 2, T))
        : Math.min(
            sdBox(ax - (S - A / 2), ay - S, az - S, A / 2, T, T),
            sdBox(ax - S, ay - (S - A / 2), az - S, T, A / 2, T),
            sdBox(ax - S, ay - S, az - (S - A / 2), T, T, A / 2),
          );
    }
    const q = qRot(qi, [x, y, z]);
    return Math.min(arms, sdBox(q[0], q[1], q[2], C, C, C) - g.bevel);
  };
}
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run src/lib/render`
Expected: PASS (quat 4, pose 8).

- [ ] **Step 5: Commit**

```bash
git add src/lib/render
git commit -m "feat: quaternion maths, logo SDF and the 7 s focus-lock choreography"
```

---

### Task 6: Ray-marcher and dot-grid painter

**Files:**
- Create: `src/lib/render/raymarch.ts`, `src/lib/render/raymarch.test.ts`, `src/lib/dotgrid/paint.ts`, `src/lib/dotgrid/paint.test.ts`, `src/lib/dotgrid/svg.ts`, `src/lib/dotgrid/svg.test.ts`

**Interfaces:**
- Consumes: `qConj`, `qRot`, `Vec3` (Task 5); `makeLogoSdf`, `LogoGeom`, `HERO_GEOM`, `NAV_CUBE_GEOM` (Task 5); `pose`, `LOCK_CENTRE`, `Pose` (Task 5).
- Produces:
  - `interface DotCell { cov: number; lum: number; color?: string; alpha?: number }`; `interface PaintSpec { cols: number; rows: number; cell: number; square?: boolean; bgGrid?: boolean; background?: string | null }`; `clamp01(v)`; `grey(v): string`; `dotRadius(spec, cov): number`; `setupCanvas(canvas, cssW, cssH): CanvasRenderingContext2D`; `paintCells(ctx, spec, cells): void` (`paint.ts`). `background` defaults to `#0A0A0A`; `null` = transparent.
  - `shade(n: Vec3): number`; `renderLogo(grid: { cols: number; rows: number; ss?: number }, g: LogoGeom, p: Pose): (DotCell | undefined)[]` (row-major, `cols × rows`) (`raymarch.ts`)
  - `cellsToSvg(spec: PaintSpec, cells): string` (`svg.ts`)

- [ ] **Step 1: Write the failing tests**

`src/lib/render/raymarch.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { LOCK_CENTRE, pose } from './pose';
import { renderLogo, shade } from './raymarch';
import { HERO_GEOM, NAV_CUBE_GEOM } from './sdf';

describe('renderLogo', () => {
  it('hits the cube in the centre and nothing in the corner', () => {
    const cells = renderLogo({ cols: 28, rows: 28, ss: 2 }, NAV_CUBE_GEOM, pose(LOCK_CENTRE, 'sway'));
    const centre = cells[14 * 28 + 14];
    expect(centre?.cov).toBe(1);
    expect(centre!.lum).toBeGreaterThan(0);
    expect(centre!.lum).toBeLessThanOrEqual(1);
    expect(cells[0]).toBeUndefined();
  });

  it('draws the brackets in the hero geometry', () => {
    const p = pose(LOCK_CENTRE, 'orbit');
    const withArms = renderLogo({ cols: 60, rows: 46 }, HERO_GEOM, p).filter(Boolean).length;
    const cubeOnly = renderLogo({ cols: 60, rows: 46 }, { ...HERO_GEOM, noArms: true }, p).filter(Boolean).length;
    expect(withArms).toBeGreaterThan(cubeOnly + 20);
  });

  it('gives edge cells partial coverage without supersampling (anti-aliasing)', () => {
    const cells = renderLogo({ cols: 60, rows: 46 }, HERO_GEOM, pose(LOCK_CENTRE, 'orbit'));
    expect(cells.some((c) => c && c.cov > 0 && c.cov < 1)).toBe(true);
  });
});

describe('shade', () => {
  it('stays within [0, 1]', () => {
    for (const n of [[0, 0, -1], [0, 1, 0], [1, 0, 0], [0, 0, 1]] as const) {
      const v = shade(n);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
```

`src/lib/dotgrid/paint.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { grey, paintCells } from './paint';

function fakeCtx() {
  return {
    fillStyle: '', globalAlpha: 1,
    fillRect: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(),
  } as unknown as CanvasRenderingContext2D & Record<string, ReturnType<typeof vi.fn>>;
}

describe('grey', () => {
  it('maps 0..1 onto a dark-to-light ramp, monotonically', () => {
    expect(grey(0)).toBe('rgb(28,28,28)');
    expect(grey(1)).toBe('rgb(242,242,242)');
    expect(grey(-3)).toBe(grey(0));
    const g = (v: number) => Number(grey(v).match(/\d+/)![0]);
    expect(g(0.3)).toBeLessThan(g(0.6));
  });
});

describe('paintCells', () => {
  it('fills the background, then one square per lit cell', () => {
    const ctx = fakeCtx();
    paintCells(ctx, { cols: 3, rows: 1, cell: 2, square: true }, [{ cov: 1, lum: 1 }, undefined, { cov: 1, lum: 0.5 }]);
    expect(ctx.fillRect).toHaveBeenCalledTimes(3);
  });

  it('clears instead of filling when the background is transparent', () => {
    const ctx = fakeCtx();
    paintCells(ctx, { cols: 1, rows: 1, cell: 4, background: null }, [undefined]);
    expect(ctx.clearRect).toHaveBeenCalledTimes(1);
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it('draws round dots by default', () => {
    const ctx = fakeCtx();
    paintCells(ctx, { cols: 2, rows: 1, cell: 4 }, [{ cov: 1, lum: 1 }, { cov: 0.5, lum: 1 }]);
    expect(ctx.arc).toHaveBeenCalledTimes(2);
  });
});
```

`src/lib/dotgrid/svg.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { cellsToSvg } from './svg';

describe('cellsToSvg', () => {
  it('emits a background and one shape per lit cell', () => {
    const svg = cellsToSvg({ cols: 2, rows: 2, cell: 10 }, [{ cov: 1, lum: 1 }, undefined, undefined, { cov: 1, lum: 0.2 }]);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('viewBox="0 0 20 20"');
    expect(svg.match(/<circle/g)).toHaveLength(2);
    expect(svg).toContain('<rect width="20" height="20" fill="#0A0A0A"/>');
  });

  it('uses squares and no background when asked', () => {
    const svg = cellsToSvg({ cols: 1, rows: 1, cell: 2, square: true, background: null }, [{ cov: 1, lum: 1 }]);
    expect(svg).not.toContain('fill="#0A0A0A"');
    expect(svg.match(/<rect/g)).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to see failure**

Run: `npx vitest run src/lib/render/raymarch.test.ts src/lib/dotgrid`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/lib/dotgrid/paint.ts`:

```ts
export interface DotCell {
  /** 0..1 coverage: partial = smaller dot (anti-aliasing) */
  cov: number;
  /** 0..1 brightness, used when no explicit colour */
  lum: number;
  color?: string;
  alpha?: number;
}

export interface PaintSpec {
  cols: number;
  rows: number;
  /** cell size in CSS px */
  cell: number;
  /** square pixels instead of round dots (small sizes) */
  square?: boolean;
  /** faint, radially faded background dot grid */
  bgGrid?: boolean;
  /** default '#0A0A0A'; null = transparent */
  background?: string | null;
}

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export function grey(v: number): string {
  const g = Math.round(28 + Math.pow(clamp01(v), 0.85) * 214);
  return `rgb(${g},${g},${g})`;
}

export const dotRadius = (spec: PaintSpec, cov: number): number => spec.cell * (0.16 + 0.27 * cov);
export const squareSize = (spec: PaintSpec, cov: number): number => spec.cell * (0.35 + 0.65 * cov);

export function bgGridAlpha(spec: PaintSpec, i: number, j: number): number {
  const dx = (i - spec.cols / 2) / (spec.cols / 2), dy = (j - spec.rows / 2) / (spec.rows / 2);
  const f = clamp01(1 - Math.hypot(dx * 0.9, dy) * 0.75);
  return f > 0.05 ? 0.1 * f : 0;
}

export function setupCanvas(canvas: HTMLCanvasElement, cssW: number, cssH: number): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function paintCells(ctx: CanvasRenderingContext2D, spec: PaintSpec, cells: readonly (DotCell | undefined)[]): void {
  const { cols, rows, cell } = spec;
  const bg = spec.background === undefined ? '#0A0A0A' : spec.background;
  ctx.globalAlpha = 1;
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cols * cell, rows * cell);
  } else {
    ctx.clearRect(0, 0, cols * cell, rows * cell);
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const c = cells[j * cols + i];
      const x = (i + 0.5) * cell, y = (j + 0.5) * cell;
      if (!c || c.cov <= 0.02) {
        const a = spec.bgGrid ? bgGridAlpha(spec, i, j) : 0;
        if (a > 0) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, cell * 0.11, 0, Math.PI * 2);
          ctx.fill();
        }
        continue;
      }
      ctx.globalAlpha = c.alpha ?? 1;
      ctx.fillStyle = c.color ?? grey(c.lum);
      if (spec.square) {
        const s = squareSize(spec, c.cov);
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius(spec, c.cov), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
}
```

`src/lib/dotgrid/svg.ts`:

```ts
import { bgGridAlpha, dotRadius, grey, squareSize, type DotCell, type PaintSpec } from './paint';

/** The same picture paintCells draws, as an SVG string (for favicons and OG images). */
export function cellsToSvg(spec: PaintSpec, cells: readonly (DotCell | undefined)[]): string {
  const W = spec.cols * spec.cell, H = spec.rows * spec.cell;
  const bg = spec.background === undefined ? '#0A0A0A' : spec.background;
  const parts: string[] = [];
  if (bg) parts.push(`<rect width="${W}" height="${H}" fill="${bg}"/>`);
  for (let j = 0; j < spec.rows; j++) {
    for (let i = 0; i < spec.cols; i++) {
      const c = cells[j * spec.cols + i];
      const x = (i + 0.5) * spec.cell, y = (j + 0.5) * spec.cell;
      if (!c || c.cov <= 0.02) {
        const a = spec.bgGrid ? bgGridAlpha(spec, i, j) : 0;
        if (a > 0) parts.push(`<circle cx="${x}" cy="${y}" r="${(spec.cell * 0.11).toFixed(2)}" fill="#fff" fill-opacity="${a.toFixed(3)}"/>`);
        continue;
      }
      const fill = c.color ?? grey(c.lum);
      const op = c.alpha !== undefined && c.alpha < 1 ? ` fill-opacity="${c.alpha.toFixed(3)}"` : '';
      if (spec.square) {
        const s = squareSize(spec, c.cov);
        parts.push(`<rect x="${(x - s / 2).toFixed(2)}" y="${(y - s / 2).toFixed(2)}" width="${s.toFixed(2)}" height="${s.toFixed(2)}" fill="${fill}"${op}/>`);
      } else {
        parts.push(`<circle cx="${x}" cy="${y}" r="${dotRadius(spec, c.cov).toFixed(2)}" fill="${fill}"${op}/>`);
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${parts.join('')}</svg>`;
}
```

(The background-grid branch draws circles only when `bgGrid` is set, so the first svg test's two circles are the two lit cells.)

`src/lib/render/raymarch.ts`:

```ts
import { clamp01, type DotCell } from '../dotgrid/paint';
import type { Pose } from './pose';
import { qConj, qRot, type Vec3 } from './quat';
import { makeLogoSdf, type LogoGeom } from './sdf';

const KEY: Vec3 = (() => {
  const l = Math.hypot(-0.5, 0.75, -0.45);
  return [-0.5 / l, 0.75 / l, -0.45 / l];
})();

/** Key light plus a rim term, for a world-space normal. */
export function shade(n: Vec3): number {
  const key = Math.max(0, n[0] * KEY[0] + n[1] * KEY[1] + n[2] * KEY[2]);
  return clamp01(0.1 + 0.9 * key + 0.28 * Math.pow(1 - Math.abs(n[2]), 2.2));
}

/** Sphere-trace the logo onto a square-celled grid. ss > 1 supersamples each cell (ss × ss rays). */
export function renderLogo(grid: { cols: number; rows: number; ss?: number }, g: LogoGeom, p: Pose): (DotCell | undefined)[] {
  const { cols, rows } = grid;
  const ss = grid.ss ?? 1;
  const sx = g.span / (cols / 2);
  const f = makeLogoSdf(g, p);
  const inv = qConj(p.qCam);
  const dir = qRot(inv, [0, 0, 1]);
  const out = new Array<DotCell | undefined>(cols * rows);

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let cov = 0, lum = 0;
      for (let sj = 0; sj < ss; sj++) {
        for (let si = 0; si < ss; si++) {
          const wx = (i - cols / 2 + (si + 0.5) / ss) * sx;
          const wy = -(j - rows / 2 + (sj + 0.5) / ss) * sx;
          const o = qRot(inv, [wx, wy, -4]);
          let t = 0, dmin = Infinity, tmin = 0, hit = false;
          for (let k = 0; k < 72 && t < 8; k++) {
            const d = f(o[0] + dir[0] * t, o[1] + dir[1] * t, o[2] + dir[2] * t);
            if (d < dmin) { dmin = d; tmin = t; }
            if (d < 0.0015) { hit = true; break; }
            t += Math.max(d * 0.85, 0.002);
          }
          // near misses count as partial coverage: cheap anti-aliasing when not supersampling
          const c = hit ? 1 : ss > 1 ? 0 : clamp01(0.5 - dmin / (sx * 0.9));
          if (c <= 0) continue;
          const tt = hit ? t : tmin, e = 0.0025;
          const px = o[0] + dir[0] * tt, py = o[1] + dir[1] * tt, pz = o[2] + dir[2] * tt;
          const nx = f(px + e, py, pz) - f(px - e, py, pz);
          const ny = f(px, py + e, pz) - f(px, py - e, pz);
          const nz = f(px, py, pz + e) - f(px, py, pz - e);
          const nl = Math.hypot(nx, ny, nz) || 1;
          lum += shade(qRot(p.qCam, [nx / nl, ny / nl, nz / nl])) * c;
          cov += c;
        }
      }
      if (cov > 0) out[j * cols + i] = { cov: cov / (ss * ss), lum: lum / cov };
    }
  }
  return out;
}
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run src/lib/render src/lib/dotgrid`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/render/raymarch.ts src/lib/render/raymarch.test.ts src/lib/dotgrid
git commit -m "feat: dot-matrix ray-marcher and canvas/SVG dot painters"
```

---

### Task 7: Hero logo, motto decode, slow-device guard

**Files:**
- Create: `src/lib/logo/hero.ts`
- Modify: `src/components/index/Hero.astro` (rewrite)

**Interfaces:**
- Consumes: `register`, `prefersReducedMotion` (Task 2); `pose`, `logoTime`, `lockWeight`, `LOCK_CENTRE` (Task 5); `renderLogo` (Task 6); `HERO_GEOM` (Task 5); `setupCanvas`, `paintCells` (Task 6); `makeTextSeeds`, `decodeText`, `mulberry32` (Task 3); `SITE.motto` (Task 1); `reportError` (Task 1).
- Produces: `mountHero(root: HTMLElement): void` — `root` is the `[data-hero]` section containing `[data-hero-logo]` (with a `<canvas>` and `img.hero-fallback`) and `[data-motto]`. Sets `data-fallback` on `[data-hero-logo]` when it gives up. Fallback image path `/logo-still.png` (generated in Task 12).

- [ ] **Step 1: Implement `hero.ts`**

`src/lib/logo/hero.ts`:

```ts
import { decodeText, makeTextSeeds } from '../decode/text';
import { mulberry32 } from '../decode/rng';
import { paintCells, setupCanvas } from '../dotgrid/paint';
import { prefersReducedMotion, register, type Handle } from '../motion/scheduler';
import { LOCK_CENTRE, lockWeight, logoTime, pose } from '../render/pose';
import { renderLogo } from '../render/raymarch';
import { HERO_GEOM } from '../render/sdf';
import { reportError } from '../report';

const ASPECT = 430 / 560;
const MOTTO_SECONDS = 1.2;
const SLOW_MS = 50;

export function mountHero(root: HTMLElement): void {
  const box = root.querySelector<HTMLElement>('[data-hero-logo]');
  const canvas = box?.querySelector('canvas');
  const motto = root.querySelector<HTMLElement>('[data-motto]');
  if (!box || !canvas) return;

  let quality = 1;
  let cols = 0, rows = 0, cell = 0;
  let ctx: CanvasRenderingContext2D;

  const size = () => {
    const w = box.clientWidth;
    const base = window.innerWidth < 640 ? 72 : 124;
    cols = Math.max(24, Math.round(base * quality));
    cell = w / cols;
    rows = Math.round((w * ASPECT) / cell);
    ctx = setupCanvas(canvas, cols * cell, rows * cell);
  };
  const draw = (t: number) => paintCells(ctx, { cols, rows, cell, bgGrid: true }, renderLogo({ cols, rows }, HERO_GEOM, pose(t, 'orbit')));

  const fallBack = (err?: unknown) => {
    if (err) reportError(err);
    box.dataset.fallback = '';
  };

  try {
    size();
  } catch (err) {
    fallBack(err);
    return;
  }

  // motto: real text stays in the DOM; it is blanked, then decoded on the first focus lock
  const text = motto?.dataset.text ?? '';
  const rng = mulberry32(11);
  const seeds = makeTextSeeds(text, rng);

  if (prefersReducedMotion()) {
    draw(LOCK_CENTRE);
    return;
  }

  if (motto) motto.textContent = decodeText(text, seeds, 0, rng);
  let mottoStart: number | null = null;
  let mottoDone = false;

  let samples = 0, totalMs = 0, windowStart = performance.now();
  let handle: Handle | null = null;

  window.addEventListener('resize', () => { try { size(); } catch (err) { fallBack(err); } });

  handle = register({
    el: box,
    fps: 30,
    frame: (now) => {
      const t = logoTime(now);
      const start = performance.now();
      draw(t);
      totalMs += performance.now() - start;
      samples++;

      // slow-device guard: coarser grid first, then the still image
      if (start - windowStart > 2000) {
        if (totalMs / samples > SLOW_MS) {
          if (quality === 1) {
            quality = 0.6;
            size();
          } else {
            handle?.stop();
            fallBack();
          }
        }
        samples = 0; totalMs = 0; windowStart = start;
      }

      if (motto && !mottoDone) {
        if (mottoStart === null && lockWeight(t) > 0.5) mottoStart = now;
        if (mottoStart !== null) {
          const p = (now - mottoStart) / MOTTO_SECONDS;
          motto.textContent = decodeText(text, seeds, Math.min(1, p), rng);
          if (p >= 1) mottoDone = true;
        }
      }
    },
  });
}
```

- [ ] **Step 2: Rewrite the hero component**

`src/components/index/Hero.astro`:

```astro
---
import { SITE } from '../../lib/seo';
---

<section id="top" class="flex min-h-svh flex-col items-center justify-center gap-10 px-6 pt-20" data-hero>
	<div class="hero-logo w-full max-w-[560px]" data-hero-logo role="img" aria-label="Pixel Perfection logo">
		<canvas class="no-js-hide block"></canvas>
		<img class="hero-fallback" src="/logo-still.png" alt="" width="560" height="430" />
	</div>
	<p class="min-h-[1.4em] text-center text-[20px] leading-[1.4]" data-motto data-text={SITE.motto} aria-label={SITE.motto}>{SITE.motto}</p>
</section>

<script>
	import { mountHero } from '../../lib/logo/hero';
	import { reportError } from '../../lib/report';
	document.querySelectorAll<HTMLElement>('[data-hero]').forEach((el) => {
		try { mountHero(el); } catch (err) { reportError(err); }
	});
</script>

<style>
	.hero-fallback { display: none; width: 100%; height: auto; }
	:global(html:not(.js)) .hero-fallback,
	[data-fallback] .hero-fallback { display: block; }
	[data-fallback] canvas { display: none; }
</style>
```

- [ ] **Step 3: Verify in the browser**

Run: `npm test && npm run dev`, open `http://localhost:4321`.
Expected (compare with variant A in `docs/brainstorm/2026-10-14-logo-animations/f3-a-vs-b-refined.html`):
- Eight bracket corners and a large central cube, ray-traced in grey dots over a faint, radially faded dot grid; the frame turns slowly.
- About 1.5 s after load the cube turns square to the viewer (brackets do not move in or out), and the motto decodes in left to right during that first lock, then stays.
- Every lock shows the same three-quarter view of the brackets.
- DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce", reload: a still logo at the lock pose and the motto shown immediately.
- DevTools → Performance → CPU 6× slowdown, reload, wait 5 s: the grid gets visibly coarser (and, if still slow, the canvas is replaced by the fallback image — a broken image is expected until Task 12).
- At 390 px wide the logo uses a coarser grid and fits the screen width.

- [ ] **Step 4: Commit**

```bash
git add src/lib/logo/hero.ts src/components/index/Hero.astro
git commit -m "feat: ray-traced hero logo with focus-lock motto reveal and slow-device guard"
```

---

### Task 8: Nav logo and final navigation

**Files:**
- Create: `src/lib/logo/nav.ts`, `src/lib/logo/nav.test.ts`
- Modify: `src/components/global/Navigation.astro` (rewrite)

**Interfaces:**
- Consumes: `register`, `prefersReducedMotion` (Task 2); `pose`, `logoTime`, `LOCK_CENTRE` (Task 5); `renderLogo` (Task 6); `NAV_CUBE_GEOM` (Task 5); `setupCanvas`, `paintCells`, `DotCell` (Task 6).
- Produces: `NAV_CELLS = 28`, `NAV_PX = 56`; `hairlineBrackets(n?: number, margin?: number, len?: number): [number, number][]`; `navLogoCells(t: number): (DotCell | undefined)[]`; `mountNavLogo(canvas: HTMLCanvasElement): void`. `navLogoCells` is reused by the favicon generator in Task 12.

- [ ] **Step 1: Write the failing test**

`src/lib/logo/nav.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { LOCK_CENTRE } from '../render/pose';
import { hairlineBrackets, NAV_CELLS, navLogoCells } from './nav';

describe('hairlineBrackets', () => {
  it('draws four L-shaped 1-cell brackets inside the grid', () => {
    const cells = hairlineBrackets();
    expect(cells).toHaveLength(4 * (2 * 6 - 1));
    for (const [i, j] of cells) {
      expect(i).toBeGreaterThanOrEqual(0); expect(i).toBeLessThan(NAV_CELLS);
      expect(j).toBeGreaterThanOrEqual(0); expect(j).toBeLessThan(NAV_CELLS);
    }
    const key = new Set(cells.map(([i, j]) => `${i},${j}`));
    for (const corner of ['3,3', '24,3', '24,24', '3,24']) expect(key.has(corner)).toBe(true);
  });
});

describe('navLogoCells', () => {
  it('has the cube in the middle and grey brackets at the corners', () => {
    const cells = navLogoCells(LOCK_CENTRE);
    expect(cells).toHaveLength(NAV_CELLS * NAV_CELLS);
    expect(cells[14 * NAV_CELLS + 14]).toBeDefined();
    expect(cells[3 * NAV_CELLS + 3]).toEqual({ cov: 1, lum: 0.8 });
    expect(cells[0]).toBeUndefined();
  });

  it('keeps the brackets still while the cube moves', () => {
    const a = navLogoCells(1), b = navLogoCells(2.3);
    for (const [i, j] of hairlineBrackets()) expect(a[j * NAV_CELLS + i]).toEqual(b[j * NAV_CELLS + i]);
  });
});
```

- [ ] **Step 2: Run to see failure**

Run: `npx vitest run src/lib/logo/nav.test.ts`
Expected: FAIL — `./nav` not found.

- [ ] **Step 3: Implement**

`src/lib/logo/nav.ts`:

```ts
import { paintCells, setupCanvas, type DotCell } from '../dotgrid/paint';
import { prefersReducedMotion, register } from '../motion/scheduler';
import { LOCK_CENTRE, logoTime, pose } from '../render/pose';
import { renderLogo } from '../render/raymarch';
import { NAV_CUBE_GEOM } from '../render/sdf';

export const NAV_CELLS = 28;
export const NAV_PX = 56;
const BRACKET_LUM = 0.8;

/** Four still 1-cell L-brackets; corners at `margin` cells from each edge, arms `len` cells long. */
export function hairlineBrackets(n = NAV_CELLS, margin = 3, len = 6): [number, number][] {
  const out: [number, number][] = [];
  const corners: [number, number, number, number][] = [
    [margin, margin, 1, 1], [n - 1 - margin, margin, -1, 1],
    [n - 1 - margin, n - 1 - margin, -1, -1], [margin, n - 1 - margin, 1, -1],
  ];
  for (const [ci, cj, dx, dy] of corners) {
    out.push([ci, cj]);
    for (let s = 1; s < len; s++) out.push([ci, cj + dy * s], [ci + dx * s, cj]);
  }
  return out;
}

const BRACKETS = hairlineBrackets();

/** The nav logo: the ray-traced cube (3 × 3 supersampled, swaying camera) inside still hairline brackets. */
export function navLogoCells(t: number): (DotCell | undefined)[] {
  const cells = renderLogo({ cols: NAV_CELLS, rows: NAV_CELLS, ss: 3 }, NAV_CUBE_GEOM, pose(t, 'sway'));
  for (const [i, j] of BRACKETS) cells[j * NAV_CELLS + i] = { cov: 1, lum: BRACKET_LUM };
  return cells;
}

export function mountNavLogo(canvas: HTMLCanvasElement): void {
  const ctx = setupCanvas(canvas, NAV_PX, NAV_PX);
  const spec = { cols: NAV_CELLS, rows: NAV_CELLS, cell: NAV_PX / NAV_CELLS, square: true, background: null };
  if (prefersReducedMotion()) {
    paintCells(ctx, spec, navLogoCells(LOCK_CENTRE));
    return;
  }
  register({ el: canvas, fps: 30, frame: (now) => paintCells(ctx, spec, navLogoCells(logoTime(now))) });
}
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run src/lib/logo/nav.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Rewrite the navigation**

`src/components/global/Navigation.astro`:

```astro
<header class="fixed inset-x-0 top-0 z-50 bg-bg/90 backdrop-blur-sm">
	<nav aria-label="Main" class="label mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6">
		<a href="#top" class="flex items-center gap-3 text-fg no-underline">
			<canvas class="no-js-hide size-14" data-nav-logo aria-hidden="true"></canvas>
			<img class="js-hide size-14" src="/favicon.svg" alt="" width="56" height="56" />
			<span class="max-[480px]:sr-only">Pixel Perfection</span>
		</a>
		<ul class="flex gap-6 sm:gap-8">
			<li><a class="link no-underline" href="#work">Work</a></li>
			<li><a class="link no-underline" href="#about">About</a></li>
			<li><a class="link no-underline" href="#contact">Contact</a></li>
		</ul>
	</nav>
</header>

<script>
	import { mountNavLogo } from '../../lib/logo/nav';
	import { reportError } from '../../lib/report';
	const canvas = document.querySelector<HTMLCanvasElement>('[data-nav-logo]');
	if (canvas) {
		try { mountNavLogo(canvas); } catch (err) { reportError(err); }
	}
</script>
```

- [ ] **Step 6: Verify in the browser**

Run: `npm run dev`, open `http://localhost:4321`.
Expected (compare with variant 2 in `docs/brainstorm/2026-10-14-logo-animations/nav-logo-variants.html`):
- A 56 px logo: four still 2 px hairline brackets, a shaded cube tumbling inside, square-on at the same moments as the hero's lock.
- Brackets are pixel-sharp and never move.
- At 390 px wide: the `PIXEL PERFECTION` text is hidden, logo + three links fit on one line with no horizontal scroll (`document.documentElement.scrollWidth === 390` in the console).

- [ ] **Step 7: Commit**

```bash
git add src/lib/logo/nav.ts src/lib/logo/nav.test.ts src/components/global/Navigation.astro
git commit -m "feat: hairline-bracket nav logo with the shared tumbling cube"
```

---

### Task 9: Claudewitz bean data and the spark simulation

**Files:**
- Create: `src/lib/sparks/parse.ts`, `src/lib/sparks/parse.test.ts`, `src/lib/sparks/field.ts`, `src/lib/sparks/field.test.ts`, `scripts/extract-bean.ts`, `src/data/claudewitz-bean.json` (generated)

**Interfaces:**
- Consumes: `Rng`, `mulberry32` (Task 3); `DotCell` (Task 6).
- Produces:
  - `interface BeanDot { x: number; y: number; color: string }`, `interface BeanData { cols: number; rows: number; dots: BeanDot[] }`, `parseBeanSvg(svg: string, maxX?: number, pitch?: number): BeanData` (`parse.ts`)
  - `type SparkMode = 'idle' | 'working' | 'gathering'`; `class SparkField { mode: SparkMode; constructor(bean: BeanData, rng: Rng); dissolve(): void; gather(): void; step(): void; cells(bob?: number): (DotCell | undefined)[]; reset(): void; maxDistanceFromHome(): number }` — `step()` advances exactly one tick of 1/24 s (fixed step, so long pauses never cause jumps); `cells()` is row-major `bean.cols × bean.rows` (`field.ts`)

- [ ] **Step 1: Write the failing tests**

`src/lib/sparks/parse.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseBeanSvg } from './parse';

const SVG = `<svg viewBox="0 0 1170 384">
<circle cx="183.0" cy="33.0" r="2.3" fill="#ad91f4"/>
<circle cx="189.0" cy="39.0" r="2.3" fill="#DA7756"/>
<circle cx="171.0" cy="45.0" r="2.3" fill="#e8e2dc"/>
<circle cx="500.0" cy="45.0" r="2.3" fill="#da7756"/>
<text x="459.0" y="255.6">Claude Code, in your terminal</text>
</svg>`;

describe('parseBeanSvg', () => {
  it('keeps only the bean (left of the wordmark) and snaps to the dot grid', () => {
    const bean = parseBeanSvg(SVG);
    expect(bean.dots).toHaveLength(3);
    expect(bean.cols).toBe(4);
    expect(bean.rows).toBe(3);
    expect(bean.dots).toContainEqual({ x: 2, y: 0, color: '#ad91f4' });
    expect(bean.dots).toContainEqual({ x: 3, y: 1, color: '#da7756' });
    expect(bean.dots).toContainEqual({ x: 0, y: 2, color: '#e8e2dc' });
  });
});
```

`src/lib/sparks/field.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../decode/rng';
import { SparkField } from './field';
import type { BeanData } from './parse';

const bean: BeanData = (() => {
  const dots = [];
  for (let y = 4; y < 16; y++) for (let x = 4; x < 16; x++) if ((x - 10) ** 2 + (y - 10) ** 2 < 30) dots.push({ x, y, color: '#da7756' });
  return { cols: 20, rows: 20, dots };
})();

describe('SparkField', () => {
  it('rests as the bean', () => {
    const f = new SparkField(bean, mulberry32(1));
    expect(f.mode).toBe('idle');
    expect(f.cells().filter(Boolean)).toHaveLength(bean.dots.length);
  });

  it('dissolves every dot into a spark that swirls away', () => {
    const f = new SparkField(bean, mulberry32(1));
    f.dissolve();
    expect(f.mode).toBe('working');
    for (let i = 0; i < 60; i++) f.step();
    expect(f.cells().filter(Boolean).length).toBeGreaterThan(0);
    expect(f.maxDistanceFromHome()).toBeGreaterThan(1);
  });

  it('gathers back and settles into the bean', () => {
    const f = new SparkField(bean, mulberry32(1));
    f.dissolve();
    for (let i = 0; i < 60; i++) f.step();
    f.gather();
    expect(f.mode).toBe('gathering');
    for (let i = 0; i < 600 && f.mode !== 'idle'; i++) f.step();
    expect(f.mode).toBe('idle');
  });

  it('shifts the resting bean by the bob offset', () => {
    const f = new SparkField(bean, mulberry32(1));
    const up = f.cells(-1);
    const d = bean.dots[0];
    expect(up[(d.y - 1) * bean.cols + d.x]).toBeDefined();
  });
});
```

- [ ] **Step 2: Run to see failure**

Run: `npx vitest run src/lib/sparks`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/lib/sparks/parse.ts`:

```ts
export interface BeanDot { x: number; y: number; color: string }
export interface BeanData { cols: number; rows: number; dots: BeanDot[] }

/**
 * Claudewitz's logo-dark.svg draws the bean (left) and the wordmark (right) as dots on a 6 px pitch.
 * Keep the dots left of maxX and convert them to grid coordinates starting at 0.
 */
export function parseBeanSvg(svg: string, maxX = 450, pitch = 6): BeanData {
  const re = /<circle cx="([\d.]+)" cy="([\d.]+)" r="[\d.]+" fill="(#[0-9a-fA-F]{6})"\/>/g;
  const raw: BeanDot[] = [];
  for (const m of svg.matchAll(re)) {
    const cx = Number(m[1]), cy = Number(m[2]);
    if (cx >= maxX) continue;
    raw.push({ x: Math.round((cx - pitch / 2) / pitch), y: Math.round((cy - pitch / 2) / pitch), color: m[3].toLowerCase() });
  }
  if (!raw.length) return { cols: 0, rows: 0, dots: [] };
  const minX = Math.min(...raw.map((d) => d.x)), minY = Math.min(...raw.map((d) => d.y));
  const dots = raw.map((d) => ({ x: d.x - minX, y: d.y - minY, color: d.color }));
  return {
    cols: Math.max(...dots.map((d) => d.x)) + 1,
    rows: Math.max(...dots.map((d) => d.y)) + 1,
    dots,
  };
}
```

`src/lib/sparks/field.ts` (ported from Claudewitz `internal/tui/sparks.go`; one `step()` = one 24 fps tick):

```ts
import type { Rng } from '../decode/rng';
import type { DotCell } from '../dotgrid/paint';
import type { BeanData } from './parse';

export type SparkMode = 'idle' | 'working' | 'gathering';

interface Spark {
  x: number; y: number; vx: number; vy: number;
  hx: number; hy: number;
  angle: number; radius: number; speed: number; wobble: number; phase: number; delay: number;
  color: string;
}

const DT = 1 / 24;
const TRAIL = 0.62;

export class SparkField {
  mode: SparkMode = 'idle';
  private sparks: Spark[] = [];
  private glow: Float32Array;
  private glowColor: string[];
  private t = 0;
  private energy = 0;
  private readonly cx: number;
  private readonly cy: number;

  constructor(private readonly bean: BeanData, private readonly rng: Rng) {
    this.glow = new Float32Array(bean.cols * bean.rows);
    this.glowColor = new Array<string>(bean.cols * bean.rows).fill('');
    this.cx = bean.cols / 2;
    this.cy = bean.rows / 2;
  }

  reset(): void {
    this.mode = 'idle';
    this.sparks = [];
    this.glow.fill(0);
    this.energy = 0;
  }

  /** Each dot lifts off as a spark after a short random delay, onto its own orbit lane. */
  dissolve(): void {
    const maxR = Math.min(this.cx, this.cy);
    this.sparks = this.bean.dots.map((d) => {
      const px = d.x + 0.5, py = d.y + 0.5;
      let speed = 0.6 + 0.8 * this.rng();
      if (this.rng() < 0.2) speed = -speed * 0.6; // a few counter-rotating sparks
      return {
        x: px, y: py, vx: 0, vy: 0, hx: px, hy: py,
        angle: Math.atan2(py - this.cy, px - this.cx),
        radius: maxR * (0.25 + 0.7 * this.rng()),
        speed,
        wobble: 0.08 + 0.12 * this.rng(),
        phase: this.rng() * Math.PI * 2,
        delay: 0.45 * this.rng(),
        color: d.color,
      };
    });
    this.glow.fill(0);
    this.energy = 0;
    this.mode = 'working';
    this.plot();
  }

  /** Send each spark home; sparks and homes are matched by angle so the swirl winds down instead of crossing. */
  gather(): void {
    if (!this.sparks.length) { this.mode = 'idle'; return; }
    const ang = (x: number, y: number) => Math.atan2(y - this.cy, x - this.cx);
    const homes = this.bean.dots.map((d) => ({ x: d.x + 0.5, y: d.y + 0.5, color: d.color })).sort((a, b) => ang(a.x, a.y) - ang(b.x, b.y));
    this.sparks.sort((a, b) => ang(a.x, a.y) - ang(b.x, b.y));
    this.sparks.forEach((s, k) => {
      const h = homes[Math.floor((k * homes.length) / this.sparks.length)];
      s.hx = h.x; s.hy = h.y; s.color = h.color;
    });
    this.mode = 'gathering';
  }

  step(): void {
    if (this.mode === 'idle') return;
    this.t += DT;
    this.energy += (1 - this.energy) * 0.08;
    let settled = true;
    for (const s of this.sparks) {
      if (this.mode === 'working') {
        if (s.delay > 0) { s.delay -= DT; continue; }
        s.angle += s.speed * this.energy * DT * 2.2;
        const r = s.radius * (1 + s.wobble * Math.sin(this.t * 2.3 * s.speed + s.phase));
        const tx = this.cx + r * Math.cos(s.angle), ty = this.cy + r * Math.sin(s.angle);
        s.vx = (tx - s.x) * 0.18;
        s.vy = (ty - s.y) * 0.18;
      } else {
        // damped spring home, with a little overshoot
        s.vx = s.vx * 0.78 + (s.hx - s.x) * 0.09;
        s.vy = s.vy * 0.78 + (s.hy - s.y) * 0.09;
        if (Math.abs(s.hx - s.x) > 0.35 || Math.abs(s.hy - s.y) > 0.35 || Math.abs(s.vx) + Math.abs(s.vy) > 0.1) settled = false;
      }
      s.x += s.vx;
      s.y += s.vy;
    }
    if (this.mode === 'gathering' && settled) {
      this.reset();
      return;
    }
    for (let i = 0; i < this.glow.length; i++) this.glow[i] *= TRAIL;
    this.plot();
  }

  /** Largest distance of any spark from its home (for tests and debugging). */
  maxDistanceFromHome(): number {
    return this.sparks.reduce((m, s) => Math.max(m, Math.hypot(s.x - s.hx, s.y - s.hy)), 0);
  }

  cells(bob = 0): (DotCell | undefined)[] {
    const { cols, rows } = this.bean;
    const out = new Array<DotCell | undefined>(cols * rows);
    if (this.mode === 'idle') {
      for (const d of this.bean.dots) {
        const y = d.y + bob;
        if (y >= 0 && y < rows) out[y * cols + d.x] = { cov: 1, lum: 1, color: d.color };
      }
      return out;
    }
    for (let i = 0; i < this.glow.length; i++) {
      if (this.glow[i] > 0.04) out[i] = { cov: 1, lum: 1, color: this.glowColor[i], alpha: this.glow[i] };
    }
    return out;
  }

  private plot(): void {
    const { cols, rows } = this.bean;
    for (const s of this.sparks) {
      const x = Math.floor(s.x), y = Math.floor(s.y);
      if (x >= 0 && x < cols && y >= 0 && y < rows) {
        this.glow[y * cols + x] = 1;
        this.glowColor[y * cols + x] = s.color;
      }
    }
  }
}
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run src/lib/sparks`
Expected: PASS (parse 1, field 4).

- [ ] **Step 5: Extract the real bean**

`scripts/extract-bean.ts`:

```ts
import { readFileSync, writeFileSync } from 'node:fs';
import { parseBeanSvg } from '../src/lib/sparks/parse';

const src = process.argv[2];
if (!src) {
  console.error('usage: npx tsx scripts/extract-bean.ts <path to claudewitz/assets/logo-dark.svg>');
  process.exit(1);
}
const bean = parseBeanSvg(readFileSync(src, 'utf8'));
writeFileSync('src/data/claudewitz-bean.json', JSON.stringify(bean));
console.log(`bean: ${bean.dots.length} dots, ${bean.cols} × ${bean.rows}`);
```

Run: `npx tsx scripts/extract-bean.ts ../claudewitz/assets/logo-dark.svg`
Expected: prints roughly `bean: 1000–1800 dots, ~72 × ~64`. If `cols` is above 80, the cut-off `maxX` caught wordmark dots: open the SVG, find the smallest `cx` of the wordmark's first letter, and pass a lower `maxX` to `parseBeanSvg` in the script.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sparks scripts/extract-bean.ts src/data/claudewitz-bean.json
git commit -m "feat: Claudewitz bean dots and the dissolve/swirl/gather spark simulation"
```

---

### Task 10: Claudewitz showcase — data, demo, copy button, analytics

**Files:**
- Create: `src/data/projects.ts`, `src/data/projects.test.ts`, `src/lib/sparks/demo.ts`, `src/lib/sparks/demo.test.ts`, `src/lib/sparks/mount.ts`, `src/lib/copy/clipboard.ts`, `src/lib/copy/clipboard.test.ts`, `src/lib/copy/mount.ts`, `src/components/work/Showcase.astro`, `src/components/work/demos/ClaudewitzDemo.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `DecodeFrame`, `AsciiHeader` (Task 4); `SparkField`, `BeanData` (Task 9); `paintCells`, `setupCanvas` (Task 6); `register`, `prefersReducedMotion` (Task 2); `track` (Task 1); `reportError` (Task 1).
- Produces:
  - `type DemoId = 'claudewitz'`; `interface ProjectLink { label: string; href?: string; copy?: string; event?: string }`; `interface Project { id: string; name: string; brand: { primary: string; secondary?: string }; description: string; features: string[]; links: ProjectLink[]; demo: DemoId }`; `projects: Project[]`; `frameLabel(index: number, name: string): string` (`projects.ts`)
  - `PROMPT`, `COMMAND`, `OUTPUT: string[]`, `TRANSCRIPT`, `terminalText(ms: number): { text: string; done: boolean }`, `cursorOn(ms: number): boolean` (`demo.ts`)
  - `mountClaudewitzDemo(root: HTMLElement): void` (`sparks/mount.ts`)
  - `copyText(text: string, clip?: { writeText(t: string): Promise<void> }): Promise<boolean>` (`clipboard.ts`); `mountCopyButtons(root?: ParentNode): void` (`copy/mount.ts`)

Note: the spec's `demo: AstroComponent` field is implemented as a `DemoId` key that `Showcase.astro` maps to the component, so `projects.ts` stays plain, testable TypeScript. Adding a project = an entry here + a demo component registered in `Showcase.astro`'s `demos` map.

- [ ] **Step 1: Write the failing tests**

`src/data/projects.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { frameLabel, projects } from './projects';

describe('projects', () => {
  it('has Claudewitz first, in its brand orange', () => {
    expect(projects[0].id).toBe('claudewitz');
    expect(projects[0].brand.primary).toBe('#DA7756');
  });

  it('keeps every entry within the design rules', () => {
    for (const p of projects) {
      expect(p.features.length).toBeGreaterThanOrEqual(3);
      expect(p.features.length).toBeLessThanOrEqual(4);
      expect(p.brand.primary).toMatch(/^#[0-9A-F]{6}$/i);
      for (const l of p.links) expect(Boolean(l.href) !== Boolean(l.copy)).toBe(true);
    }
  });

  it('formats frame labels', () => {
    expect(frameLabel(0, 'Claudewitz')).toBe('01 / CLAUDEWITZ');
    expect(frameLabel(11, 'Next')).toBe('12 / NEXT');
  });
});
```

`src/lib/sparks/demo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { COMMAND, OUTPUT, terminalText, TRANSCRIPT, TYPE_MS } from './demo';

describe('terminalText', () => {
  it('starts with an empty prompt', () => expect(terminalText(0)).toEqual({ text: '$ ', done: false }));
  it('types the command one character per tick', () => expect(terminalText(4 * TYPE_MS).text).toBe('$ brew'));
  it('prints the output after the command', () => {
    const t = terminalText(COMMAND.length * TYPE_MS + 400);
    expect(t.text.split('\n')[1]).toBe(OUTPUT[0]);
    expect(t.done).toBe(false);
  });
  it('ends with the full transcript', () => expect(terminalText(60_000)).toEqual({ text: TRANSCRIPT, done: true }));
  it('never goes backwards for negative time', () => expect(terminalText(-100).text).toBe('$ '));
});
```

`src/lib/copy/clipboard.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { copyText } from './clipboard';

describe('copyText', () => {
  it('copies and reports success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(copyText('brew install x', { writeText })).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('brew install x');
  });
  it('reports failure when the clipboard rejects (denied, insecure context)', async () => {
    await expect(copyText('x', { writeText: () => Promise.reject(new Error('denied')) })).resolves.toBe(false);
  });
  it('reports failure when there is no clipboard API', async () => {
    await expect(copyText('x', undefined)).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Run to see failure**

Run: `npx vitest run src/data src/lib/sparks/demo.test.ts src/lib/copy`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the pure modules**

`src/data/projects.ts`:

```ts
export type DemoId = 'claudewitz';

export interface ProjectLink {
  label: string;
  href?: string;
  /** text copied to the clipboard instead of navigating */
  copy?: string;
  /** analytics event fired on success */
  event?: string;
}

export interface Project {
  id: string;
  /** display name; also the ANSI header text */
  name: string;
  brand: { primary: string; secondary?: string };
  description: string;
  /** 3–4 short lines */
  features: string[];
  links: ProjectLink[];
  demo: DemoId;
}

export const projects: Project[] = [
  {
    id: 'claudewitz',
    name: 'Claudewitz',
    brand: { primary: '#DA7756', secondary: '#B497FF' },
    description: 'A Crush-style terminal UI for Claude Code that runs on the subscription you already have.',
    features: [
      'Drives the claude CLI, so Claude Code\'s tools, MCP servers, skills and hooks just work.',
      'Streams Markdown, thinking and tool calls as they happen.',
      'Syntax-highlighted, side-by-side diffs for every edit.',
      'Images drawn inline, in colour, with half blocks.',
    ],
    links: [
      { label: 'GitHub', href: 'https://github.com/ExManubis/Claudewitz' },
      { label: '$ brew install exmanubis/tap/claudewitz', copy: 'brew install exmanubis/tap/claudewitz', event: 'install_command_copied' },
    ],
    demo: 'claudewitz',
  },
];

export const frameLabel = (index: number, name: string): string => `${String(index + 1).padStart(2, '0')} / ${name.toUpperCase()}`;
```

(The description and features are drafts from the Claudewitz README; Mikkel approves the wording before launch — spec §15.)

`src/lib/sparks/demo.ts`:

```ts
export const PROMPT = '$ ';
export const COMMAND = 'brew install exmanubis/tap/claudewitz';
export const OUTPUT = ['==> Fetching exmanubis/tap/claudewitz', '==> Pouring claudewitz', '✓ claudewitz installed', '$ claudewitz'];
export const TYPE_MS = 40;
export const PAUSE_MS = 300;
export const LINE_MS = 350;
export const TRANSCRIPT = [PROMPT + COMMAND, ...OUTPUT].join('\n');

/** The terminal's text `ms` milliseconds into the demo. */
export function terminalText(ms: number): { text: string; done: boolean } {
  const typed = Math.min(COMMAND.length, Math.max(0, Math.floor(ms / TYPE_MS)));
  const after = ms - COMMAND.length * TYPE_MS - PAUSE_MS;
  const shown = typed < COMMAND.length || after < 0 ? 0 : Math.min(OUTPUT.length, Math.floor(after / LINE_MS) + 1);
  return { text: [PROMPT + COMMAND.slice(0, typed), ...OUTPUT.slice(0, shown)].join('\n'), done: shown === OUTPUT.length };
}

export const cursorOn = (ms: number): boolean => Math.floor(ms / 530) % 2 === 0;
```

`src/lib/copy/clipboard.ts`:

```ts
export async function copyText(
  text: string,
  clip: { writeText(t: string): Promise<void> } | undefined = typeof navigator !== 'undefined' ? navigator.clipboard : undefined,
): Promise<boolean> {
  if (!clip) return false;
  try {
    await clip.writeText(text);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run src/data src/lib/sparks/demo.test.ts src/lib/copy`
Expected: PASS.

- [ ] **Step 5: Implement the DOM mounts**

`src/lib/copy/mount.ts`:

```ts
import { track } from '../analytics';
import { copyText } from './clipboard';

export function mountCopyButtons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLButtonElement>('button[data-copy]:not([data-mounted])').forEach((btn) => {
    btn.dataset.mounted = '';
    const label = btn.textContent ?? '';
    const status = btn.closest('[data-copy-scope]')?.querySelector<HTMLElement>('[data-copy-status]');
    btn.addEventListener('click', async () => {
      const ok = await copyText(btn.dataset.copy ?? '');
      if (status) status.textContent = ok ? 'Install command copied to the clipboard.' : 'Copy failed. Select the command to copy it.';
      if (ok && btn.dataset.event) track(btn.dataset.event);
      btn.textContent = ok ? 'Copied' : 'Copy failed';
      window.setTimeout(() => { btn.textContent = label; }, 1500);
    });
  });
}
```

`src/lib/sparks/mount.ts`:

```ts
import bean from '../../data/claudewitz-bean.json';
import { track } from '../analytics';
import { mulberry32 } from '../decode/rng';
import { paintCells, setupCanvas } from '../dotgrid/paint';
import { prefersReducedMotion, register } from '../motion/scheduler';
import { cursorOn, terminalText, TRANSCRIPT } from './demo';
import { SparkField } from './field';
import type { BeanData } from './parse';

const CELL = 4;
const IDLE_S = 2;
const WORK_S = 2.6;

export function mountClaudewitzDemo(root: HTMLElement): void {
  const term = root.querySelector<HTMLElement>('[data-terminal]');
  const replay = root.querySelector<HTMLButtonElement>('[data-replay]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-bean]');
  if (!term || !canvas) return;

  const data = bean as BeanData;
  const spec = { cols: data.cols, rows: data.rows, cell: CELL, background: null };
  const ctx = setupCanvas(canvas, data.cols * CELL, data.rows * CELL);
  const field = new SparkField(data, mulberry32(7));

  if (prefersReducedMotion()) {
    term.textContent = TRANSCRIPT;
    paintCells(ctx, spec, field.cells());
    return;
  }

  let started: number | null = null; // seconds
  let phaseSince = 0;

  const restart = (now: number) => {
    started = now;
    phaseSince = 0;
    field.reset();
    term.textContent = '$ ';
    paintCells(ctx, spec, []);
  };

  // start when at least half the demo is on screen
  const io = new IntersectionObserver((records) => {
    if (records.some((r) => r.intersectionRatio >= 0.5) && started === null) {
      restart(performance.now() / 1000);
      io.disconnect();
    }
  }, { threshold: 0.5 });
  io.observe(root);

  replay?.addEventListener('click', () => {
    restart(performance.now() / 1000);
    track('demo_replayed');
  });

  term.textContent = '$ ';
  register({
    el: root,
    fps: 24,
    frame: (now) => {
      if (started === null) return;
      const ms = (now - started) * 1000;
      const { text, done } = terminalText(ms);
      term.textContent = done ? text : text + (cursorOn(ms) ? '█' : ' ');
      if (!done) return;
      if (!phaseSince) phaseSince = now;

      const inPhase = now - phaseSince;
      if (field.mode === 'idle' && inPhase > IDLE_S) { field.dissolve(); phaseSince = now; }
      else if (field.mode === 'working' && inPhase > WORK_S) { field.gather(); phaseSince = now; }
      const wasGathering = field.mode === 'gathering';
      field.step();
      if (wasGathering && field.mode === 'idle') phaseSince = now;

      const bob = field.mode === 'idle' && Math.sin((now - phaseSince) * Math.PI * 2 * 0.9) > 0.55 ? -1 : 0;
      paintCells(ctx, spec, field.cells(bob));
    },
  });
}
```

- [ ] **Step 6: Write the components**

`src/components/work/demos/ClaudewitzDemo.astro`:

```astro
---
import { TRANSCRIPT } from '../../../lib/sparks/demo';
---

<div class="claudewitz-demo grid items-center gap-10 sm:grid-cols-[minmax(0,1fr)_auto]" data-claudewitz-demo>
	<button type="button" class="terminal" data-replay aria-label="Replay the Claudewitz install demo">
		<pre data-terminal>{TRANSCRIPT}</pre>
	</button>
	<canvas class="mx-auto max-w-full" data-bean aria-hidden="true"></canvas>
</div>

<script>
	import { mountClaudewitzDemo } from '../../../lib/sparks/mount';
	import { reportError } from '../../../lib/report';
	document.querySelectorAll<HTMLElement>('[data-claudewitz-demo]').forEach((el) => {
		try { mountClaudewitzDemo(el); } catch (err) { reportError(err); }
	});
</script>

<style>
	.terminal {
		display: block;
		width: 100%;
		min-height: 9.5em;
		padding: 20px 22px;
		border: 1px solid var(--color-subtle);
		background: #0d0d0d;
		color: var(--color-fg);
		font: inherit;
		font-size: 13px;
		line-height: 1.6;
		text-align: left;
		cursor: pointer;
		overflow-x: auto;
	}
	.terminal:hover { border-color: var(--color-muted); }
	.terminal pre { margin: 0; white-space: pre; }
</style>
```

`src/components/work/Showcase.astro`:

```astro
---
import DecodeFrame from '../frame/DecodeFrame.astro';
import AsciiHeader from '../type/AsciiHeader.astro';
import ClaudewitzDemo from './demos/ClaudewitzDemo.astro';
import { frameLabel, type Project } from '../../data/projects';

interface Props { project: Project; index: number }
const { project, index } = Astro.props;
const demos = { claudewitz: ClaudewitzDemo };
const Demo = demos[project.demo];
---

<section id={project.id} aria-labelledby={`${project.id}-title`} class="mx-auto w-full max-w-[960px] px-6" data-copy-scope>
	<DecodeFrame label={frameLabel(index, project.name)} brand={project.brand}>
		<h2 id={`${project.id}-title`} class="sr-only">{project.name}</h2>
		<AsciiHeader text={project.name} />
		<p class="mt-6 max-w-[34rem] text-[16px] leading-[1.6] text-muted">{project.description}</p>
		<div class="mt-12"><Demo /></div>
		<ul class="mt-12 grid max-w-[40rem] gap-3 text-[15px] leading-[1.6]">
			{project.features.map((f) => <li>{f}</li>)}
		</ul>
		<div class="label mt-12 flex flex-wrap gap-x-8 gap-y-4">
			{project.links.map((l) =>
				l.copy ? (
					<button type="button" class="link" data-copy={l.copy} data-event={l.event}>{l.label}</button>
				) : (
					<a class="link" href={l.href} target="_blank" rel="noopener">{l.label}</a>
				),
			)}
		</div>
		<p class="sr-only" aria-live="polite" data-copy-status></p>
	</DecodeFrame>
</section>

<script>
	import { mountCopyButtons } from '../../lib/copy/mount';
	mountCopyButtons();
</script>
```

Modify `src/pages/index.astro` — add the Work section between Hero and About:

```astro
---
import Layout from '../layouts/Layout.astro';
import Navigation from '../components/global/Navigation.astro';
import Hero from '../components/index/Hero.astro';
import Showcase from '../components/work/Showcase.astro';
import About from '../components/about/About.astro';
import Footer from '../components/global/Footer.astro';
import { projects } from '../data/projects';
---

<Layout>
	<Navigation />
	<main class="flex flex-col gap-[140px] sm:gap-[240px]">
		<h1 class="sr-only">Pixel Perfection</h1>
		<Hero />
		<div id="work" class="flex flex-col gap-[140px] sm:gap-[240px]">
			<h2 class="sr-only">Work</h2>
			{projects.map((project, index) => <Showcase project={project} index={index} />)}
		</div>
		<About index={projects.length + 1} />
	</main>
	<Footer />
</Layout>
```

- [ ] **Step 7: Verify in the browser**

Run: `npm test && npm run dev`, open `http://localhost:4321`, scroll to Work.
Expected:
- The frame `01 / CLAUDEWITZ` and the `CLAUDEWITZ` ANSI header decode in, both turning Claudewitz orange once mostly in view; About's frame stays grey.
- Once half the demo is visible, `brew install exmanubis/tap/claudewitz` types out with a block cursor, four lines follow, then the bean appears in its own colours, bobs, dissolves into a swirl of sparks with trails, and gathers back; this repeats.
- Clicking the terminal replays from the start (Amplitude debugger or Network tab shows `demo_replayed`).
- Clicking `$ BREW INSTALL …` copies `brew install exmanubis/tap/claudewitz`, shows `COPIED` for 1.5 s, and fires `install_command_copied`. With the clipboard blocked (open the page via `http://127.0.0.1` in a context without clipboard permission, or deny it in site settings), it shows `COPY FAILED` and nothing throws.
- Scrolling the demo off-screen pauses it (Performance panel shows no work while away).
- Reduced motion: full transcript and a still bean, no typing.

- [ ] **Step 8: Commit**

```bash
git add src/data/projects.ts src/data/projects.test.ts src/lib/sparks/demo.ts src/lib/sparks/demo.test.ts src/lib/sparks/mount.ts src/lib/copy src/components/work src/pages/index.astro
git commit -m "feat: Claudewitz showcase with live install + bean demo and copyable install command"
```

---

### Task 11: Dot-matrix portrait

**Files:**
- Create: `src/lib/portrait/dither.ts`, `src/lib/portrait/dither.test.ts`, `src/lib/portrait/mount.ts`, `scripts/build-portrait.ts`, `src/data/portrait.json` (generated)
- Modify: `src/components/about/About.astro`

**Interfaces:**
- Consumes: `paintCells`, `setupCanvas` (Task 6); `register`, `prefersReducedMotion` (Task 2); `scrollProgress`, `mulberry32` (Task 3); `reportError` (Task 1).
- Produces: `interface PortraitData { cols: number; rows: number; cells: number[] }` (0 = no dot, otherwise brightness 0..1, row-major); `toDotCells(lum: ArrayLike<number>, w: number, h: number, cols: number): PortraitData`; `placeholderLuminance(w: number, h: number): Float32Array` (`dither.ts`); `mountPortrait(canvas: HTMLCanvasElement): void` (`mount.ts`).

- [ ] **Step 1: Write the failing tests**

`src/lib/portrait/dither.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { placeholderLuminance, toDotCells } from './dither';

describe('toDotCells', () => {
  it('averages pixel blocks into cells', () => {
    const d = toDotCells(new Float32Array(16).fill(1), 4, 4, 2);
    expect(d).toEqual({ cols: 2, rows: 2, cells: [1, 1, 1, 1] });
  });
  it('turns dark areas off', () => {
    expect(toDotCells(new Float32Array(16), 4, 4, 2).cells).toEqual([0, 0, 0, 0]);
  });
  it('keeps the aspect ratio', () => {
    expect(toDotCells(new Float32Array(8 * 12), 8, 12, 4).rows).toBe(6);
  });
});

describe('placeholderLuminance', () => {
  it('draws a lit head-and-shoulders silhouette on black', () => {
    const w = 64, h = 80, lum = placeholderLuminance(w, h);
    expect(lum[Math.round(0.38 * h) * w + w / 2]).toBeGreaterThan(0.3);
    expect(lum[0]).toBe(0);
  });
});
```

- [ ] **Step 2: Run to see failure**

Run: `npx vitest run src/lib/portrait`
Expected: FAIL — `./dither` not found.

- [ ] **Step 3: Implement `dither.ts`**

`src/lib/portrait/dither.ts`:

```ts
export interface PortraitData {
  cols: number;
  rows: number;
  /** row-major; 0 = no dot, otherwise brightness 0..1 */
  cells: number[];
}

/** Box-average luminance (0..1) into a cols-wide grid of square cells. */
export function toDotCells(lum: ArrayLike<number>, w: number, h: number, cols: number): PortraitData {
  const size = w / cols;
  const rows = Math.round(h / size);
  const cells: number[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = Math.floor(c * size), x1 = Math.max(x0 + 1, Math.floor((c + 1) * size));
      const y0 = Math.floor(r * size), y1 = Math.max(y0 + 1, Math.floor((r + 1) * size));
      let sum = 0, n = 0;
      for (let y = y0; y < Math.min(y1, h); y++) for (let x = x0; x < Math.min(x1, w); x++) { sum += lum[y * w + x]; n++; }
      const v = Math.pow(n ? sum / n : 0, 1.2);
      cells.push(v < 0.08 ? 0 : Math.round(v * 100) / 100);
    }
  }
  return { cols, rows, cells };
}

/** A lit head-and-shoulders silhouette, used until Mikkel's photo is supplied. */
export function placeholderLuminance(w: number, h: number): Float32Array {
  const lum = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const head = ((x - 0.5 * w) / (0.17 * w)) ** 2 + ((y - 0.38 * h) / (0.22 * h)) ** 2;
      const shoulders = ((x - 0.5 * w) / (0.42 * w)) ** 2 + ((y - 1.02 * h) / (0.3 * h)) ** 2;
      if (head <= 1 || shoulders <= 1) lum[y * w + x] = 0.85 - 0.45 * (x / w); // light from the left
    }
  }
  return lum;
}
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run src/lib/portrait`
Expected: PASS (4 tests).

- [ ] **Step 5: Build script and placeholder data**

`scripts/build-portrait.ts`:

```ts
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { placeholderLuminance, toDotCells } from '../src/lib/portrait/dither';

const COLS = 64;
const arg = process.argv[2];
if (!arg) {
  console.error('usage: npx tsx scripts/build-portrait.ts <photo.png> | --placeholder');
  process.exit(1);
}

let data;
if (arg === '--placeholder') {
  data = toDotCells(placeholderLuminance(256, 320), 256, 320, COLS);
} else {
  const png = PNG.sync.read(readFileSync(arg));
  const lum = new Float32Array(png.width * png.height);
  for (let i = 0; i < lum.length; i++) {
    const r = png.data[i * 4], g = png.data[i * 4 + 1], b = png.data[i * 4 + 2], a = png.data[i * 4 + 3];
    lum[i] = ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * (a / 255);
  }
  data = toDotCells(lum, png.width, png.height, COLS);
}
writeFileSync('src/data/portrait.json', JSON.stringify(data));
console.log(`portrait: ${data.cols} × ${data.rows}, ${data.cells.filter((v) => v > 0).length} dots`);
```

Run: `npx tsx scripts/build-portrait.ts --placeholder`
Expected: `portrait: 64 × 80, …` and `src/data/portrait.json` written. (When the photo arrives: export it as PNG, background removed or darkened, and run `npx tsx scripts/build-portrait.ts path/to/photo.png`.)

- [ ] **Step 6: Mount and wire into About**

`src/lib/portrait/mount.ts`:

```ts
import portrait from '../../data/portrait.json';
import { scrollProgress } from '../decode/frame';
import { mulberry32 } from '../decode/rng';
import { paintCells, setupCanvas, type DotCell } from '../dotgrid/paint';
import { prefersReducedMotion, register } from '../motion/scheduler';
import type { PortraitData } from './dither';

const CELL = 4;

export function mountPortrait(canvas: HTMLCanvasElement): void {
  const { cols, rows, cells } = portrait as PortraitData;
  const ctx = setupCanvas(canvas, cols * CELL, rows * CELL);
  const spec = { cols, rows, cell: CELL, background: null };
  const rng = mulberry32(19);
  const seeds = cells.map(() => rng() * 0.9);
  const frameEl = canvas.closest<HTMLElement>('[data-decode-frame]') ?? canvas;

  const draw = (revealed: number) => {
    const out: (DotCell | undefined)[] = cells.map((v, k) => {
      if (v <= 0) return undefined;
      if (seeds[k] <= revealed) return { cov: 1, lum: v };
      return rng() < 0.15 ? { cov: 0.6, lum: rng() * 0.4 } : undefined; // noise before it resolves
    });
    paintCells(ctx, spec, out);
  };

  if (prefersReducedMotion()) {
    draw(1);
    return;
  }

  let revealed = 0;
  let finished = false;
  draw(0);
  register({
    el: canvas,
    fps: 30,
    frame: () => {
      if (finished) return;
      const r = frameEl.getBoundingClientRect();
      revealed = Math.max(revealed, scrollProgress(r.top, r.bottom, window.innerHeight));
      draw(revealed);
      if (revealed >= 1) finished = true;
    },
  });
}
```

In `src/components/about/About.astro`, replace `<div data-portrait-slot></div>` with:

```astro
<canvas class="mx-auto block max-w-full" data-portrait aria-hidden="true"></canvas>
```

and append this script block at the very end of the file, after the closing `</section>`:

```astro
<script>
	import { mountPortrait } from '../../lib/portrait/mount';
	import { reportError } from '../../lib/report';
	document.querySelectorAll<HTMLCanvasElement>('[data-portrait]').forEach((c) => {
		try { mountPortrait(c); } catch (err) { reportError(err); }
	});
</script>
```

- [ ] **Step 7: Verify in the browser**

Run: `npm test && npm run dev`, scroll to About.
Expected: a 256 px wide dot-matrix silhouette beside the ANSI `ABOUT` header and bio; while the frame decodes in, dots resolve out of sparse flickering noise in random order; once fully in view it stays still (scrolling back up does not un-resolve it). At 390 px the portrait sits above the text.

- [ ] **Step 8: Commit**

```bash
git add src/lib/portrait scripts/build-portrait.ts src/data/portrait.json src/components/about/About.astro
git commit -m "feat: dot-matrix portrait that resolves with the About frame (placeholder until the photo arrives)"
```

---

### Task 12: Brand assets — favicons, OG image, still logo

**Files:**
- Create: `scripts/render-assets.ts`, `scripts/assets/DepartureMono-Regular.otf`, `public/favicon.svg` (overwrite), `public/favicon-32.png`, `public/apple-touch-icon.png`, `public/og.png`, `public/logo-still.png`
- Modify: `src/layouts/Layout.astro`

**Interfaces:**
- Consumes: `navLogoCells`, `NAV_CELLS` (Task 8); `renderLogo` (Task 6); `HERO_GEOM` (Task 5); `pose`, `LOCK_CENTRE` (Task 5); `cellsToSvg` (Task 6); `SITE.motto` (Task 1).
- Produces: static files under `public/` referenced by Layout (`/favicon.svg`, `/favicon-32.png`, `/apple-touch-icon.png`, `/og.png`) and by Hero (`/logo-still.png`).

- [ ] **Step 1: Fetch the OTF for text rendering**

```bash
mkdir -p scripts/assets
curl -sL -o /tmp/dm.zip https://github.com/rektdeckard/departure-mono/releases/download/v1.500/DepartureMono-1.500.zip
unzip -o -q /tmp/dm.zip -d /tmp/dm
cp /tmp/dm/DepartureMono-1.500/DepartureMono-Regular.otf scripts/assets/
cp /tmp/dm/DepartureMono-1.500/LICENSE scripts/assets/DepartureMono-LICENSE.txt
```

- [ ] **Step 2: Write the generator**

`scripts/render-assets.ts`:

```ts
import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { cellsToSvg } from '../src/lib/dotgrid/svg';
import { NAV_CELLS, navLogoCells } from '../src/lib/logo/nav';
import { LOCK_CENTRE, pose } from '../src/lib/render/pose';
import { renderLogo } from '../src/lib/render/raymarch';
import { HERO_GEOM } from '../src/lib/render/sdf';
import { SITE } from '../src/lib/seo';

const FONT = 'scripts/assets/DepartureMono-Regular.otf';
const png = (svg: string, width: number) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { fontFiles: [FONT], loadSystemFonts: false, defaultFontFamily: 'Departure Mono' } })
    .render()
    .asPng();

// favicon: the nav logo at the lock pose, square pixels, transparent
const favCells = navLogoCells(LOCK_CENTRE);
const favicon = cellsToSvg({ cols: NAV_CELLS, rows: NAV_CELLS, cell: 1, square: true, background: null }, favCells);
writeFileSync('public/favicon.svg', favicon);
writeFileSync('public/favicon-32.png', png(favicon, 32));
const touch = cellsToSvg({ cols: NAV_CELLS, rows: NAV_CELLS, cell: 1, square: true, background: '#0A0A0A' }, favCells);
writeFileSync('public/apple-touch-icon.png', png(touch, 180));

// still hero logo (no-JS + slow-device fallback): the hero render at the lock pose
const cols = 124, rows = 95;
const heroCells = renderLogo({ cols, rows }, HERO_GEOM, pose(LOCK_CENTRE, 'orbit'));
const still = cellsToSvg({ cols, rows, cell: 560 / cols, bgGrid: true }, heroCells);
writeFileSync('public/logo-still.png', png(still, 1120));

// OG image: logo + motto on the page background
const logoSvg = cellsToSvg({ cols, rows, cell: 4, bgGrid: true }, heroCells)
  .replace('<svg ', '<svg x="352" y="60" ');
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#0A0A0A"/>
${logoSvg}
<text x="600" y="560" text-anchor="middle" font-family="Departure Mono" font-size="28" fill="#EDEDED">${SITE.motto.replace("'", '&#39;')}</text>
</svg>`;
writeFileSync('public/og.png', png(og, 1200));

console.log('wrote favicon.svg, favicon-32.png, apple-touch-icon.png, logo-still.png, og.png');
```

Run: `npx tsx scripts/render-assets.ts`
Expected: prints the file list. Open `public/og.png` and `public/logo-still.png`: the eight-corner bracket frame around the square-on cube in grey dots (og: motto underneath). `public/favicon.svg` in a browser tab: hairline brackets around a solid grey square.

- [ ] **Step 3: Reference the assets in the layout**

In `src/layouts/Layout.astro`, after `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` add:

```astro
		<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
		<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

and after `<meta property="og:locale" content="en_US" />` add:

```astro
		<meta property="og:image" content={`${SITE.url}/og.png`} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta name="twitter:image" content={`${SITE.url}/og.png`} />
```

- [ ] **Step 4: Verify**

Run: `npm run build && npm run preview`, open `http://localhost:4321`.
Expected: the tab shows the new favicon; view-source shows `og:image`; disable JavaScript and reload — the hero shows `logo-still.png`, the nav shows the favicon SVG, frames are thin CSS borders, all text is readable.

- [ ] **Step 5: Commit**

```bash
git add scripts/render-assets.ts scripts/assets public/favicon.svg public/favicon-32.png public/apple-touch-icon.png public/og.png public/logo-still.png src/layouts/Layout.astro
git commit -m "feat: favicons, OG image and still hero logo rendered from the logo renderer"
```

---

### Task 13: Final verification pass

**Files:**
- Modify only if a check fails (fix the owning task's files).

- [ ] **Step 1: Full test suite and build**

Run: `npm test && npm run build`
Expected: all tests pass; build succeeds.

- [ ] **Step 2: Leftovers check**

Run: `grep -rnE "EB Garamond|DM Sans|Made Dillan|dusty-rose|warm-sand|cursor-trail|fonts.googleapis|lang=\"da\"" src public || echo clean`
Expected: `clean`.

- [ ] **Step 3: Lighthouse (mobile)**

Run in one terminal: `npm run preview`
Run in another:

```bash
npx -y lighthouse@12 http://localhost:4321/ --only-categories=performance,accessibility --form-factor=mobile --screenEmulation.mobile --output=json --output-path=/tmp/lh.json --chrome-flags="--headless=new" --quiet
node -e "const r=require('/tmp/lh.json');console.log('perf',r.categories.performance.score*100,'a11y',r.categories.accessibility.score*100)"
```

Expected: `perf ≥ 90`, `a11y 100`. If performance is low, check the Lighthouse "Main-thread work" audit: the hero ray-marcher is the likely cost — lower its mobile base from 72 to 60 columns in `src/lib/logo/hero.ts` and re-run. If accessibility is below 100, fix the specific failing audit (e.g. contrast, missing label) in its component.

- [ ] **Step 4: Manual passes** (Chrome DevTools)

1. **Desktop 1440 px:** hero lock + motto reveal; Claudewitz frame/header turn orange; demo runs; About portrait resolves; footer links work; nav anchor links scroll to sections with the fixed nav not covering headers.
2. **Mobile 390 px:** no horizontal scroll (`document.documentElement.scrollWidth === 390`); nav wordmark hidden, logo + links on one line; ANSI headers on one line per row; frames close at all corners; About stacks.
3. **Reduced motion** (Rendering → prefers-reduced-motion: reduce): every animation static in its final state; no glyph flicker anywhere.
4. **No JavaScript** (Settings → Debugger → Disable JavaScript): text readable, CSS frame borders, still images for both logos.
5. **Off-screen pausing:** Performance recording while scrolled to the footer for 5 s shows no ray-marching or spark work.
6. **Keyboard:** Tab reaches nav links, the terminal replay button, GitHub link, copy button, bio link and footer links, each with a visible 1 px outline.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A src public scripts
git commit -m "fix: issues found in the final verification pass"
```

(Skip if nothing changed.)
