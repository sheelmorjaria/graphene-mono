import { describe, it, expect } from 'vitest';
import { generateBlogPostingStructuredData } from '../structuredData.js';

// Matches the fallback in structuredData.js when VITE_SITE_URL is unset.
const SITE_URL = 'https://graphene-security.com';

const post = {
  slug: 'why-choose-grapheneos',
  title: 'Why Choose GrapheneOS?',
  description: 'Privacy and security.',
  keywords: ['GrapheneOS', 'privacy'],
  datePublished: '2026-10-01',
  dateModified: '2026-10-02',
  readingTime: 9
};

describe('generateBlogPostingStructuredData', () => {
  it('builds a BlogPosting entity for the post URL', () => {
    const data = generateBlogPostingStructuredData(post);

    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('BlogPosting');
    expect(data.headline).toBe('Why Choose GrapheneOS?');
    expect(data.description).toBe('Privacy and security.');
    expect(data.url).toBe(`${SITE_URL}/blog/why-choose-grapheneos`);
    expect(data.mainEntityOfPage['@id']).toBe(`${SITE_URL}/blog/why-choose-grapheneos`);
  });

  it('publishes under the store identity, not the GrapheneOS project', () => {
    const data = generateBlogPostingStructuredData(post);

    expect(data.author).toEqual({
      '@type': 'Organization',
      name: 'Graphene Security',
      url: SITE_URL
    });
    expect(data.publisher.name).toBe('Graphene Security');
  });

  it('carries published/modified dates and joined keywords', () => {
    const data = generateBlogPostingStructuredData(post);

    expect(data.datePublished).toBe('2026-10-01');
    expect(data.dateModified).toBe('2026-10-02');
    expect(data.keywords).toBe('GrapheneOS, privacy');
  });

  it('falls back to datePublished when dateModified is absent', () => {
    const data = generateBlogPostingStructuredData({ ...post, dateModified: undefined });

    expect(data.dateModified).toBe('2026-10-01');
  });
});
