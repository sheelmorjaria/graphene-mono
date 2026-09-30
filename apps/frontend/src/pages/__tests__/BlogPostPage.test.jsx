import { render, screen, waitFor } from '../../test/test-utils';
import { describe, it, expect } from 'vitest';
import { Routes, Route } from 'react-router-dom';
import BlogPostPage from '../BlogPostPage';
import { getBlogPostBySlug } from '../../data/blogPosts';

const renderPost = (slug) =>
  render(
    <Routes>
      <Route path="/blog/:slug" element={<BlogPostPage />} />
    </Routes>,
    { initialEntries: [`/blog/${slug}`] }
  );

const SLUG = 'why-choose-grapheneos';

// Titles contain regex metacharacters ("GrapheneOS?") — escape before
// building accessible-name matchers.
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('BlogPostPage', () => {
  it('renders the article header for a published post', () => {
    renderPost(SLUG);

    const post = getBlogPostBySlug(SLUG);
    expect(post).not.toBeNull();
    expect(screen.getByRole('heading', { name: new RegExp(escapeRegExp(post.title), 'i'), level: 1 })).toBeInTheDocument();
    // Terminal-style metadata line: date · reading time
    expect(screen.getByText(/1 october 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/min read/i)).toBeInTheDocument();
  });

  it('renders the key content sections', () => {
    renderPost(SLUG);

    const sectionNames = [
      /zero telemetry/i,
      /verified boot with a re-locked bootloader/i,
      /sandboxed google play/i,
      /per-app network firewall/i,
      /storage scopes/i,
      /ready to make the switch/i
    ];
    for (const name of sectionNames) {
      expect(screen.getByRole('heading', { name, level: 2 })).toBeInTheDocument();
    }
  });

  it('renders the privacy app replacement table with its alternatives', () => {
    renderPost(SLUG);

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /instead of/i })).toBeInTheDocument();
    // Rows must name the recommended alternatives, not just the Big Tech apps
    expect(screen.getByRole('cell', { name: /signal/i })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /proton mail/i })).toBeInTheDocument();
  });

  it('links both end-of-article CTAs to the storefront pages', () => {
    renderPost(SLUG);

    const productsCta = screen.getByRole('link', { name: /secure your phone today/i });
    expect(productsCta).toHaveAttribute('href', '/products');

    const flashCta = screen.getByRole('link', { name: /learn about our flash service/i });
    expect(flashCta).toHaveAttribute('href', '/flash-service');
  });

  it('emits BlogPosting JSON-LD and an article canonical URL', async () => {
    renderPost(SLUG);

    await waitFor(() => {
      const ldScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      expect(
        ldScripts.some((script) => script.textContent?.includes('"@type":"BlogPosting"'))
      ).toBe(true);
    });

    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe(`https://graphene-security.com/blog/${SLUG}`);
  });

  it('renders the 404 treatment for an unknown slug', () => {
    renderPost('this-post-does-not-exist');

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    // No article header should leak through
    expect(screen.queryByText(/min read/i)).not.toBeInTheDocument();
  });
});

describe('BlogPostPage — Duress PIN post', () => {
  const DURESS_SLUG = 'duress-pin-grapheneos';

  it('renders the article header and guide sections', () => {
    renderPost(DURESS_SLUG);

    expect(
      screen.getByRole('heading', { name: /The Ultimate Privacy Failsafe/i, level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /What is a Duress PIN\?/i, level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /How to Set Up a Duress PIN on GrapheneOS/i, level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Crucial Safety Warnings/i, level: 2 })
    ).toBeInTheDocument();
  });

  it('renders the seven setup steps as a numbered list', () => {
    renderPost(DURESS_SLUG);

    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(7);
    expect(screen.getByText(/Confirm the Duress PIN by entering it again/i)).toBeInTheDocument();
  });

  it('links both CTAs to the storefront pages', () => {
    renderPost(DURESS_SLUG);

    const shopCta = screen.getByRole('link', { name: /Shop Pre-Installed GrapheneOS Phones/i });
    expect(shopCta).toHaveAttribute('href', '/products');

    const flashCta = screen.getByRole('link', { name: /Learn About Our Mail-in Flash Service/i });
    expect(flashCta).toHaveAttribute('href', '/flash-service');
  });

  it('emits BlogPosting JSON-LD and the duress canonical URL', async () => {
    renderPost(DURESS_SLUG);

    await waitFor(() => {
      const ldScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      expect(
        ldScripts.some((script) => script.textContent?.includes('"@type":"BlogPosting"'))
      ).toBe(true);
    });

    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe(`https://graphene-security.com/blog/${DURESS_SLUG}`);
  });
});
