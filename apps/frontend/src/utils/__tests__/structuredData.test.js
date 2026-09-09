import { describe, it, expect } from 'vitest';
import {
  generateProductStructuredData,
  generateOrganizationStructuredData,
  generateFAQStructuredData
} from '../structuredData.js';

// These schemas are baked into the prerendered HTML that AI crawlers read —
// wrong domains, missing prices or entity conflation ship straight to prod.

const buildProduct = (overrides = {}) => ({
  _id: 'prod1',
  name: 'GrapheneOS Pixel 7A',
  slug: 'grapheneos-pixel-7a',
  description: 'Privacy phone',
  images: ['/images/7a.jpg'],
  // The REAL API shape: price lives on variations, plus priceRange/isInStock.
  variations: [
    { price: 265, salePrice: null, stockStatus: 'in_stock' },
    { price: 300, salePrice: 280, stockStatus: 'in_stock' }
  ],
  priceRange: { min: 265, max: 300 },
  isInStock: true,
  ...overrides
});

describe('generateProductStructuredData', () => {
  it('derives the offer price from variations (API has no product.price)', () => {
    const schema = generateProductStructuredData(buildProduct());
    expect(schema.offers.price).toBe(265);
  });

  it('prefers salePrice when present and takes the cheapest variation', () => {
    const schema = generateProductStructuredData(buildProduct({
      variations: [
        { price: 300, salePrice: null, stockStatus: 'in_stock' },
        { price: 350, salePrice: 250, stockStatus: 'in_stock' }
      ]
    }));
    expect(schema.offers.price).toBe(250);
  });

  it('falls back to priceRange.min when variations are missing', () => {
    const schema = generateProductStructuredData(buildProduct({ variations: undefined }));
    expect(schema.offers.price).toBe(265);
  });

  it('marks availability from isInStock', () => {
    expect(generateProductStructuredData(buildProduct()).offers.availability)
      .toBe('https://schema.org/InStock');
    expect(generateProductStructuredData(buildProduct({ isInStock: false })).offers.availability)
      .toBe('https://schema.org/OutOfStock');
  });

  it('uses the production domain and absolute image URLs by default', () => {
    const schema = generateProductStructuredData(buildProduct());
    expect(schema.offers.url).toBe('https://graphene-security.com/products/grapheneos-pixel-7a');
    expect(schema.image[0]).toBe('https://graphene-security.com/images/7a.jpg');
  });

  it('brands the hardware Google and sells via the store', () => {
    const schema = generateProductStructuredData(buildProduct());
    expect(schema.brand).toEqual({ '@type': 'Brand', name: 'Google' });
    expect(schema.offers.seller.name).toBe('Graphene Security');
  });
});

describe('generateOrganizationStructuredData', () => {
  it('points at the production domain (was the defunct grapheneos-store.com)', () => {
    const schema = generateOrganizationStructuredData();
    expect(schema.url).toBe('https://graphene-security.com');
  });

  it('never claims the GrapheneOS project\'s social identities via sameAs', () => {
    // The store is a reseller, not the OS project: sameAs listing
    // twitter.com/grapheneos conflates two different entities.
    const schema = generateOrganizationStructuredData();
    const sameAs = JSON.stringify(schema.sameAs || []);
    expect(sameAs).not.toContain('twitter.com/grapheneos');
    expect(sameAs).not.toContain('github.com/GrapheneOS');
  });

  it('does not publish a placeholder phone number', () => {
    const schema = generateOrganizationStructuredData();
    expect(JSON.stringify(schema)).not.toContain('XXXX');
  });
});

describe('generateFAQStructuredData', () => {
  it('emits a FAQPage schema with questions and plain-text answers', () => {
    const schema = generateFAQStructuredData([
      { question: 'What is GrapheneOS?', answer: 'A privacy and security focused mobile OS based on Android.' },
      { question: 'Do I need an account to buy?', answer: 'No. Guest checkout via PayPal is available.' }
    ]);

    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(2);
    expect(schema.mainEntity[0]).toEqual({
      '@type': 'Question',
      name: 'What is GrapheneOS?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A privacy and security focused mobile OS based on Android.'
      }
    });
  });
});
