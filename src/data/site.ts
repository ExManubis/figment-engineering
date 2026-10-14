export const EMAIL = 'mikkel@figment.engineering';
export const SMALLCLAIMS_URL = 'https://smallclaims.ai';

/** Links without a URL are not rendered. */
export const social: { github: string; x?: string; linkedin?: string } = {
  github: 'https://github.com/ExManubis',
  x: 'https://x.com/bytepiratos',
  linkedin: 'https://www.linkedin.com/in/mikkel-j%C3%B8rgensen-134316329/',
};

export function footerLinks(s = social): { label: string; href: string }[] {
  const links: { label: string; href?: string }[] = [
    { label: EMAIL, href: `mailto:${EMAIL}` },
    { label: 'GitHub', href: s.github },
    { label: 'X', href: s.x },
    { label: 'LinkedIn', href: s.linkedin },
    { label: 'smallclaims', href: SMALLCLAIMS_URL },
  ];
  return links.filter((l): l is { label: string; href: string } => Boolean(l.href));
}
