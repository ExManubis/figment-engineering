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
