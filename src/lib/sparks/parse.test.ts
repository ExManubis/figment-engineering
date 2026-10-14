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
