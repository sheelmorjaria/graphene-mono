import { render, screen, waitFor } from '../../test/test-utils';
import { describe, it, expect } from 'vitest';
import BlogListPage from '../BlogListPage';
import { blogPosts } from '../../data/blogPosts';

// Titles contain regex metacharacters ("GrapheneOS?") — escape before
// building accessible-name matchers.
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('BlogListPage', () => {
  it('renders the blog heading and intro copy', () => {
    render(<BlogListPage />);

    expect(screen.getByRole('heading', { name: /privacy insights & guides/i })).toBeInTheDocument();
  });

  it('renders a card for every registered post, linking to the article', () => {
    render(<BlogListPage />);

    expect(blogPosts.length).toBeGreaterThan(0);
    for (const post of blogPosts) {
      const card = screen.getByRole('link', { name: new RegExp(escapeRegExp(post.title), 'i') });
      expect(card).toHaveAttribute('href', `/blog/${post.slug}`);
    }
  });

  it('shows each post with its publication date', () => {
    render(<BlogListPage />);

    // The registry post is published 2026-10-01 — shown in en-GB long form
    expect(screen.getByText(/1 October 2026/i)).toBeInTheDocument();
  });

  it('sets the listing SEO metadata', async () => {
    render(<BlogListPage />);

    await waitFor(() => {
      expect(document.title).toContain('Blog');
    });
    const description = document.querySelector('meta[name="description"]');
    expect(description?.getAttribute('content')).toBeTruthy();
  });
});
