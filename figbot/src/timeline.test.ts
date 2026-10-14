import { describe, expect, it } from 'vitest';
import { expectPoseClose } from './expect-pose';
import { POSES } from './model';
import { BLINKS, KEYFRAMES, LOOP, TRANSITION, live, poseAt } from './timeline';

describe('poseAt', () => {
  it('loops seamlessly: the end meets the start', () => {
    expectPoseClose(poseAt(LOOP - 1e-9), poseAt(0));
  });

  it('wraps negative and far-future times into the loop', () => {
    expect(poseAt(-1)).toEqual(poseAt(13));
    expectPoseClose(poseAt(LOOP * 100 + 3), poseAt(3));
  });

  it.each(KEYFRAMES.map(k => [k.name, k.at] as const))('holds %s (from %ss) once its transition is done', (name, at) => {
    const t = at + 0.45;
    expect(poseAt(t)).toEqual(live({ pose: POSES[name], thinking: name === 'thinking' ? 1 : 0 }, t));
  });

  it('hides every shape change behind a blink', () => {
    let changes = 0;
    KEYFRAMES.forEach((k, i) => {
      const prev = KEYFRAMES[(i - 1 + KEYFRAMES.length) % KEYFRAMES.length];
      if (POSES[prev.name].shape === POSES[k.name].shape) return;
      changes++;
      expect(poseAt(k.at + TRANSITION / 2).open, `${prev.name} → ${k.name}`).toBeLessThanOrEqual(0.1);
    });
    expect(changes).toBe(3); // thinking→happy, happy→excited, excited→worried
  });

  it('blinks at each blink time', () => {
    for (const b of BLINKS) expect(poseAt(b).open).toBeLessThanOrEqual(0.1);
  });

  it('breathes', () => {
    const bobs = [0.5, 1.6, 2.7].map(t => poseAt(t).bob);
    expect(new Set(bobs.map(b => b.toFixed(5))).size).toBe(3);
    for (const b of bobs) expect(Math.abs(b)).toBeLessThanOrEqual(0.006 + 1e-12);
  });
});
