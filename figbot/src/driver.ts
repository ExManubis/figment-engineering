import { EXPRESSIONS, POSES, type ExpressionName, type Pose } from './model';
import { TRANSITION, live, smoothstep, stageAt, transition, type Stage } from './timeline';

export interface Driver {
  pose(now: number): Pose;
  press(key: string, now: number): void;
}

/** Live-page state: plays the loop; keys 1–7 hold an expression, 0 resumes. Every change blends from what is on screen. */
export function createDriver(): Driver {
  let held: ExpressionName | null = null;
  let loopT = 0;               // loop time at `mark`
  let mark = 0;                // wall time of the last change
  let from: Stage | null = null;
  let dip = false;             // blink through this blend? decided once per change

  const target = (now: number): Stage =>
    held ? { pose: POSES[held], thinking: held === 'thinking' ? 1 : 0 } : stageAt(loopT + now - mark);

  const stage = (now: number): Stage => {
    const to = target(now);
    const k = (now - mark) / TRANSITION;
    if (!from || k >= 1) return to;
    const s = smoothstep(k);
    return { pose: transition(from.pose, to.pose, k, dip), thinking: from.thinking + (to.thinking - from.thinking) * s };
  };

  return {
    pose: (now) => live(stage(now), now),
    press(key, now) {
      if (!/^\d$/.test(key)) return;
      const n = Number(key);
      if (n > EXPRESSIONS.length || (n === 0 && held === null)) return;
      const current = stage(now);
      if (held === null) loopT += now - mark;   // freeze the loop where it is
      held = n === 0 ? null : EXPRESSIONS[n - 1];
      from = current;
      mark = now;
      // the loop may change shape mid-blend; decide the blink now so it can't switch on halfway
      const shape = current.pose.shape;
      dip = shape !== target(now).pose.shape || shape !== target(now + TRANSITION).pose.shape;
    },
  };
}
