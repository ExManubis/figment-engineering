import { POSES, lerp, type ExpressionName, type Pose } from './model';

export const LOOP = 14;
export const FPS = 30;
export const TRANSITION = 0.35;

const BLINK = 0.09;   // half-width of a blink, s
const BREATH = 0.006;
const DRIFT = 0.012;
// whole cycles per loop keep it seamless: 3 breaths, 2 drifts
const W_BREATH = (2 * Math.PI * 3) / LOOP;
const W_DRIFT = (2 * Math.PI * 2) / LOOP;

export const KEYFRAMES: readonly { at: number; name: ExpressionName }[] = [
  { at: 0, name: 'idle' },
  { at: 2.0, name: 'curious' },
  { at: 3.8, name: 'thinking' },
  { at: 5.8, name: 'happy' },
  { at: 7.2, name: 'excited' },
  { at: 8.6, name: 'worried' },
  { at: 10.2, name: 'sleepy' },
  { at: 12.4, name: 'idle' },
];

/** An idle blink, and the wake-up blink after Sleepy. */
export const BLINKS: readonly number[] = [1.2, 13.0];

export const smoothstep = (k: number) => {
  const x = Math.min(1, Math.max(0, k));
  return x * x * (3 - 2 * x);
};

// exact for t already in [0, LOOP), unlike ((t % LOOP) + LOOP) % LOOP
const wrap = (t: number) => t - LOOP * Math.floor(t / LOOP);

/** Blend a → b at raw progress k (0..1); a change of eye shape is hidden behind a blink (`dip`). */
export function transition(a: Pose, b: Pose, k: number, dip = a.shape !== b.shape): Pose {
  const p = lerp(a, b, smoothstep(k));
  if (dip) p.open *= 1 - 0.94 * (1 - Math.abs(2 * Math.min(1, Math.max(0, k)) - 1));
  return p;
}

/** A pose before breathing and drift; `thinking` weights the Thinking drift (0..1). */
export interface Stage { pose: Pose; thinking: number }

const blinkAt = (t: number) => {
  let m = 1;
  for (const b of BLINKS) {
    const d = Math.abs(t - b);
    if (d < BLINK) m = Math.min(m, Math.max(0.06, d / BLINK));
  }
  return m;
};

export function stageAt(t: number): Stage {
  const tt = wrap(t);
  let i = KEYFRAMES.length - 1;
  while (KEYFRAMES[i].at > tt) i--;
  const cur = KEYFRAMES[i];
  const prev = KEYFRAMES[(i - 1 + KEYFRAMES.length) % KEYFRAMES.length];
  const k = (tt - cur.at) / TRANSITION;
  const s = smoothstep(k);
  const pose = k < 1 ? transition(POSES[prev.name], POSES[cur.name], k) : { ...POSES[cur.name] };
  pose.open *= blinkAt(tt);
  return { pose, thinking: (cur.name === 'thinking' ? s : 0) + (prev.name === 'thinking' ? 1 - s : 0) };
}

/** Layer the idle breath and the Thinking drift onto a stage, at clock time t. */
export function live(s: Stage, t: number): Pose {
  return {
    ...s.pose,
    bob: s.pose.bob + BREATH * Math.sin(W_BREATH * t),
    gx: s.pose.gx + s.thinking * DRIFT * Math.sin(W_DRIFT * t),
  };
}

export function poseAt(t: number): Pose {
  return live(stageAt(t), wrap(t));
}
