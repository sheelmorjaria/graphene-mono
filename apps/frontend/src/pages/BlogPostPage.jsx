import { Link, useParams } from 'react-router-dom';
import SEOWrapper from '../components/SEO/SEOWrapper';
import NotFoundPage from './NotFoundPage';
import { getBlogPostBySlug, formatBlogDate } from '../data/blogPosts';
import {
  generateBlogPostingStructuredData,
  generateBreadcrumbStructuredData
} from '../utils/structuredData';

const BlogPostPage = () => {
  const { slug } = useParams();
  const post = getBlogPostBySlug(slug);

  // Unknown slug: same treatment as any other missing page — the article
  // layout must not render around content that doesn't exist.
  if (!post) {
    return <NotFoundPage />;
  }

  const PostBody = post.component;

  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <SEOWrapper
        title={post.title}
        description={post.description}
        keywords={post.keywords}
        type="article"
        canonical={`/blog/${post.slug}`}
        structuredData={[
          generateBlogPostingStructuredData(post),
          generateBreadcrumbStructuredData([
            { name: 'Products', url: '/products' },
            { name: 'Blog', url: '/blog' },
            { name: post.title }
          ])
        ]}
      />

      <div className="container mx-auto px-4">
        <article className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider text-text-muted">
              <li>
                <Link to="/products" className="hover:text-cyan-400 transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-cyan-400/50">/</li>
              <li>
                <Link to="/blog" className="hover:text-cyan-400 transition-colors duration-200">
                  Blog
                </Link>
              </li>
              <li aria-hidden="true" className="text-cyan-400/50">/</li>
              <li aria-current="page" className="text-text-secondary truncate max-w-[16rem] sm:max-w-md">
                {post.title}
              </li>
            </ol>
          </nav>

          {/* Article header */}
          <header className="mb-12 pb-8 border-b border-border-subtle">
            <p className="font-mono text-xs text-cyan-400 tracking-[0.25em] uppercase mb-4">
              // article
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-text-primary leading-tight mb-6">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-text-muted uppercase tracking-wider">
              <time dateTime={post.datePublished}>{formatBlogDate(post.datePublished)}</time>
              <span aria-hidden="true" className="text-cyan-400/50">•</span>
              <span>{post.readingTime} min read</span>
              <span aria-hidden="true" className="text-cyan-400/50">•</span>
              <span>Graphene Security</span>
            </div>
          </header>

          {/* Body — one component per post, from the static registry */}
          <PostBody />

          {/* Footer */}
          <footer className="mt-14 pt-8 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 font-mono text-sm text-cyan-400 uppercase tracking-wider hover:text-cyan-300 transition-colors duration-200"
            >
              <span aria-hidden="true">←</span> Back to all articles
            </Link>
            <span className="font-mono text-xs text-text-muted uppercase tracking-wider">
              Published by Graphene Security
            </span>
          </footer>
        </article>
      </div>
    </div>
  );
};

export default BlogPostPage;
