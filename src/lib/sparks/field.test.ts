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
