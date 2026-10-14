export const EMAIL = 'sales@pixelperfection.dev';

/** X and LinkedIn are added once Mikkel supplies the URLs (spec §15). Links without a URL are not rendered. */
export const social: { github: string; x?: string; linkedin?: string } = {
  github: 'https://github.com/ExManubis',
};

export function footerLinks(s = social): { label: string; href: string }[] {
  const links: { label: string; href?: string }[] = [
    { label: EMAIL, href: `mailto:${EMAIL}` },
    { label: 'GitHub', href: s.github },
    { label: 'X', href: s.x },
    { label: 'LinkedIn', href: s.linkedin },
  ];
  return links.filter((l): l is { label: string; href: string } => Boolean(l.href));
}
