import { describe, expect, it } from 'vitest';
import { personJsonLd, SITE } from './seo';

describe('personJsonLd', () => {
  it('describes Mikkel as a Person with the Figment Engineering brand', () => {
    const ld = personJsonLd({ github: 'https://github.com/ExManubis' }) as Record<string, any>;
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Mikkel Jørgensen');
    expect(ld.jobTitle).toBe('Design // AI Engineer');
    expect(ld.worksFor.name).toBe('smallclaims');
    expect(ld.brand.name).toBe('Figment Engineering');
    expect(ld.url).toBe(SITE.url);
  });

  it('only lists social profiles that have a URL', () => {
    const ld = personJsonLd({ github: 'https://github.com/ExManubis', linkedin: 'https://linkedin.com/in/x' }) as Record<string, any>;
    expect(ld.sameAs).toEqual(['https://github.com/ExManubis', 'https://linkedin.com/in/x']);
  });

  it('has no business-listing fields from the old site', () => {
    const ld = personJsonLd() as Record<string, any>;
    expect(ld.taxID).toBeUndefined();
    expect(ld.priceRange).toBeUndefined();
  });
});
