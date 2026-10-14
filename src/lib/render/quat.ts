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
