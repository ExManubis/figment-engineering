import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CELL } from './trail';

const css = readFileSync(new URL('../../styles/global.css', import.meta.url), 'utf8');

describe('the background dot texture', () => {
  it('sits on the cursor trail grid, so trail dots land on texture dots', () => {
    expect(css).toContain(`--dot-cell: ${CELL}px;`);
  });
});
