import { EMAIL, social as defaultSocial } from '../data/site';

export const SITE = {
  url: 'https://pixelperfection.dev',
  title: 'Pixel Perfection: Mikkel Jørgensen',
  motto: "Things I make when no one's asking.",
  description:
    "Things I make when no one's asking. The after-hours work of Mikkel Jørgensen, Design // AI Engineer in Copenhagen.",
};

export function personJsonLd(s: { github?: string; x?: string; linkedin?: string } = defaultSocial): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Mikkel Jørgensen',
    jobTitle: 'Design // AI Engineer',
    worksFor: { '@type': 'Organization', name: 'smallclaims', url: 'https://smallclaims.ai' },
    url: SITE.url,
    email: `mailto:${EMAIL}`,
    address: { '@type': 'PostalAddress', addressLocality: 'Copenhagen', addressCountry: 'DK' },
    brand: { '@type': 'Brand', name: 'Pixel Perfection', logo: `${SITE.url}/favicon.svg` },
    sameAs: [s.github, s.x, s.linkedin].filter(Boolean),
  };
}
