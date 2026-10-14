import { describe, expect, it } from 'vitest';
import { footerLinks } from './site';

describe('footerLinks', () => {
  it('lists the email, then GitHub, X, LinkedIn and smallclaims', () => {
    expect(footerLinks().map((l) => l.label)).toEqual(['mikkel@figment.engineering', 'GitHub', 'X', 'LinkedIn', 'smallclaims']);
    expect(footerLinks().at(-1)?.href).toBe('https://smallclaims.ai');
    expect(footerLinks().find((l) => l.label === 'X')?.href).toBe('https://x.com/bytepiratos');
  });

  it('leaves out profiles without a URL', () => {
    expect(footerLinks({ github: 'https://github.com/ExManubis' }).map((l) => l.label)).toEqual(['mikkel@figment.engineering', 'GitHub', 'smallclaims']);
  });
});
