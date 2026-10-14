import { describe, expect, it } from 'vitest';
import { POSES } from './model';
import { createDriver } from './driver';
import { live, poseAt, stageAt } from './timeline';
import { expectPoseClose } from './expect-pose';

describe('driver', () => {
  it('plays the loop until a key is pressed', () => {
    const d = createDriver();
    for (const t of [0, 3.3, 9.1, 20]) expectPoseClose(d.pose(t), poseAt(t));
  });

  it('holds the expression for the pressed number key', () => {
    const d = createDriver();
    d.press('4', 1);
    const p = d.pose(3);
    expect(p.shape).toBe('chevron');
    expectPoseClose(p, live({ pose: POSES.excited, thinking: 0 }, 3));
  });

  it('never jumps when a key is pressed', () => {
    const d = createDriver();
    const before = d.pose(5);
    d.press('3', 5);
    expectPoseClose(d.pose(5), before);
  });

  it('never jumps on a key pressed mid-transition', () => {
    const d = createDriver();
    d.press('3', 5);
    const before = d.pose(5.1);
    d.press('6', 5.1);
    expectPoseClose(d.pose(5.1), before);
  });

  it('resumes the loop from where it paused, blending in without a jump', () => {
    const d = createDriver();
    d.press('2', 4);
    const before = d.pose(8);
    d.press('0', 8);
    expectPoseClose(d.pose(8), before);
    expectPoseClose(d.pose(9), live(stageAt(5), 9));
  });

  it('ignores every other key, and 0 while the loop is already playing', () => {
    const d = createDriver();
    for (const k of ['0', '8', '9', 'a', ' ', 'Enter', '10']) d.press(k, 2);
    expectPoseClose(d.pose(6), poseAt(6));
  });
});
