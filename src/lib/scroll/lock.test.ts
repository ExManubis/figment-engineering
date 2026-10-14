import { describe, expect, it } from 'vitest';
import { currentIndex, nextTarget, stopPositions, WheelGate, type Layout } from './lock';

const NAV = 80;

// hero 0–900, two projects that fit a 900px screen, about running to the end of the page
const fits: Layout = {
  sections: [{ top: 0, bottom: 900 }, { top: 1140, bottom: 1900 }, { top: 2140, bottom: 2870 }, { top: 3110, bottom: 3800 }],
  vh: 900,
  nav: NAV,
  max: 2900,
};

describe('stopPositions', () => {
  it('lines each section up under the nav, clamped to the page', () => {
    expect(stopPositions(fits)).toEqual([0, 1060, 2060, 2900]);
  });

  it('centres a section marked to centre in the space under the nav, when it fits', () => {
    const centred = { ...fits, sections: fits.sections.map((x, i) => (i === 1 || i === 2 ? { ...x, center: true } : x)) };
    // 760 tall in 820 of space: 30 above and below; 730 tall: 45
    expect(stopPositions(centred)).toEqual([0, 1030, 2015, 2900]);
    // too tall for a 720px screen: back to the top under the nav
    expect(stopPositions({ ...centred, vh: 720, max: 3080 })).toEqual([0, 1060, 2060, 3030]);
  });
});

describe('currentIndex', () => {
  it('is the last stop at or above the scroll position, forgiving a few pixels', () => {
    const pos = stopPositions(fits);
    expect(currentIndex(pos, 0)).toBe(0);
    expect(currentIndex(pos, 1058)).toBe(1);
    expect(currentIndex(pos, 1500)).toBe(1);
    expect(currentIndex(pos, 2900)).toBe(3);
  });
});

describe('nextTarget', () => {
  it('moves one stop at a time and stops at the ends', () => {
    expect(nextTarget(fits, 0, 1)).toBe(1060);
    expect(nextTarget(fits, 1060, 1)).toBe(2060);
    expect(nextTarget(fits, 2060, -1)).toBe(1060);
    expect(nextTarget(fits, 0, -1)).toBeNull();
    expect(nextTarget(fits, 2900, 1)).toBeNull();
  });

  it('treats a nav link landing (16px short of a stop, from scroll-margin-top) as that stop', () => {
    expect(nextTarget(fits, 1044, 1)).toBe(2060);
    expect(nextTarget(fits, 1044, -1)).toBe(0);
  });

  it('from between stops, goes back to the top of the current section first', () => {
    expect(nextTarget(fits, 1300, -1)).toBe(1060);
    expect(nextTarget(fits, 1300, 1)).toBe(2060);
  });

  // a 720px screen: the 760px project sections no longer fit under the nav
  // (the hero fills the screen, so it is 720 tall here)
  const short: Layout = { ...fits, sections: [{ top: 0, bottom: 720 }, ...fits.sections.slice(1)], vh: 720, max: 3080 };

  it('jumps straight on from a section that fits', () => {
    expect(nextTarget(short, 0, 1)).toBe(1060);
  });

  it('scrolls down within a tall section until its bottom shows, then jumps', () => {
    // at the project's stop (1060) its bottom (1900) is below the screen's bottom (1780)
    expect(nextTarget(short, 1060, 1)).toBe(1180);
    expect(nextTarget(short, 1180, 1)).toBe(2060);
  });

  it('going up, lands on the bottom of a tall previous section, then steps up through it', () => {
    expect(nextTarget(short, 2060, -1)).toBe(1180);
    expect(nextTarget(short, 1180, -1)).toBe(1060);
  });
});

describe('WheelGate', () => {
  it('fires once per gesture once the scroll passes the threshold', () => {
    const g = new WheelGate(30, 150);
    expect(g.wheel(10, 0)).toBe(0);
    expect(g.wheel(25, 16)).toBe(1);
    expect(g.wheel(40, 32)).toBe(0); // same gesture
  });

  it('ignores trackpad momentum until it has been quiet, and while animating', () => {
    const g = new WheelGate(30, 150);
    expect(g.wheel(-50, 0)).toBe(-1);
    g.setAnimating(true);
    expect(g.wheel(-50, 400)).toBe(0); // after a gap, but still moving
    g.setAnimating(false);
    for (let t = 500; t < 1200; t += 50) expect(g.wheel(-20, t)).toBe(0); // momentum tail, 50ms apart
    expect(g.wheel(-60, 1400)).toBe(-1); // a new gesture after 150ms of quiet
  });

  it('lets a mouse wheel click through each time it is quiet', () => {
    const g = new WheelGate(30, 150);
    expect(g.wheel(100, 0)).toBe(1);
    expect(g.wheel(100, 400)).toBe(1);
  });

  it('starts a fresh count after a pause, so stray nudges never add up', () => {
    const g = new WheelGate(30, 150);
    expect(g.wheel(20, 0)).toBe(0);
    expect(g.wheel(20, 500)).toBe(0);
  });
});
