// Static blog registry. Posts are React components — the blog is content
// marketing, not a CMS, so there is deliberately no backend: everything here
// prerenders to static HTML for crawlers (see utils/prerenderRoutes.js).
//
// To publish a new post:
//   1. Create src/components/blog/<Name>Post.jsx exporting the article body.
//   2. Add an entry below, newest first.
import WhyChooseGrapheneOSPost from '../components/blog/WhyChooseGrapheneOSPost';
import DuressPINPost from '../components/blog/DuressPINPost';

export const blogPosts = [
  {
    slug: 'duress-pin-grapheneos',
    title: 'The Ultimate Privacy Failsafe: How to Set Up a Duress PIN on GrapheneOS',
    description:
      'If you are ever forced to unlock your phone, a GrapheneOS Duress PIN wipes the device the instant it is entered. What duress codes are, who needs one, and how to configure it safely.',
    keywords: [
      'GrapheneOS duress PIN',
      'duress password',
      'wipe phone under duress',
      'GrapheneOS security features',
      'rubber-hose cryptanalysis',
      'coercion protection',
      'GrapheneOS factory reset wipe'
    ],
    datePublished: '2026-10-01',
    dateModified: '2026-10-01',
    readingTime: 5,
    component: DuressPINPost
  },
  {
    slug: 'why-choose-grapheneos',
    title: 'Why Choose GrapheneOS? Reclaiming Your Mobile Privacy and Security',
    description:
      'GrapheneOS is the gold standard for mobile privacy: zero telemetry, hardened memory allocation, verified boot with a re-locked bootloader, Sandboxed Google Play, per-app network firewall and Storage Scopes — explained in plain English.',
    keywords: [
      'GrapheneOS',
      'privacy phone',
      'degoogled phone',
      'secure smartphone',
      'Sandboxed Google Play',
      'Storage Scopes',
      'GrapheneOS banking apps',
      'privacy app alternatives'
    ],
    datePublished: '2026-10-01',
    dateModified: '2026-10-01',
    readingTime: 9,
    component: WhyChooseGrapheneOSPost
  }
];

export const getBlogPostBySlug = (slug) =>
  blogPosts.find((post) => post.slug === slug) || null;

export const formatBlogDate = (isoDate) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
