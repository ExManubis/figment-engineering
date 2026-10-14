import { EMAIL, SMALLCLAIMS_URL, social as defaultSocial } from '../data/site';

export const SITE = {
  url: 'https://figment.engineering',
  title: 'Figment Engineering',
  motto: "Things I make when no one's asking.",
  description:
    'Design and engineering for AI-era tools, built in Copenhagen by Mikkel Jørgensen.',
};

export function personJsonLd(s: { github?: string; x?: string; linkedin?: string } = defaultSocial): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Mikkel Jørgensen',
    jobTitle: 'Design // AI Engineer',
    worksFor: { '@type': 'Organization', name: 'smallclaims', url: SMALLCLAIMS_URL },
    url: SITE.url,
    email: `mailto:${EMAIL}`,
    address: { '@type': 'PostalAddress', addressLocality: 'Copenhagen', addressCountry: 'DK' },
    brand: { '@type': 'Brand', name: 'Figment Engineering', logo: `${SITE.url}/favicon.svg` },
    sameAs: [s.github, s.x, s.linkedin].filter(Boolean),
  };
}
