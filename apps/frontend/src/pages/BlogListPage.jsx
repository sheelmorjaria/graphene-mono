import { Link } from 'react-router-dom';
import SEOWrapper from '../components/SEO/SEOWrapper';
import { blogPosts, formatBlogDate } from '../data/blogPosts';
import {
  generateWebPageStructuredData,
  generateBreadcrumbStructuredData
} from '../utils/structuredData';

const BlogListPage = () => {
  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <SEOWrapper
        title="Blog — Privacy Insights & Guides"
        description="Guides and insights on mobile privacy, GrapheneOS and reclaiming your digital footprint, from the Graphene Security team."
        keywords={['privacy blog', 'GrapheneOS guides', 'mobile privacy', 'degoogling']}
        canonical="/blog"
        structuredData={[
          generateWebPageStructuredData({
            name: 'Blog — Privacy Insights & Guides',
            description: 'Guides and insights on mobile privacy and GrapheneOS from Graphene Security.',
            path: '/blog',
            type: 'Blog',
            breadcrumbs: [
              { name: 'Products', url: '/products' },
              { name: 'Blog' }
            ]
          }),
          generateBreadcrumbStructuredData([
            { name: 'Products', url: '/products' },
            { name: 'Blog' }
          ])
        ]}
      />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="font-mono text-xs text-cyan-400 tracking-[0.3em] uppercase mb-3">
            // knowledge_base
          </p>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-text-primary mb-4">
            Privacy Insights &amp; Guides
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Practical writing on mobile privacy, GrapheneOS and taking back control of your
            digital life — from the team that flashes the phones.
          </p>
        </div>

        {/* Post cards */}
        <div className="max-w-3xl mx-auto space-y-6">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="block group p-6 sm:p-8 bg-bg-card border border-border-subtle rounded-lg hover:border-cyan-400/40 hover:shadow-glow-cyan transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-3 font-mono text-xs text-text-muted uppercase tracking-wider">
                <time dateTime={post.datePublished}>{formatBlogDate(post.datePublished)}</time>
                <span aria-hidden="true" className="text-cyan-400/50">•</span>
                <span>{post.readingTime} min read</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-text-primary group-hover:text-cyan-400 transition-colors duration-200 mb-3">
                {post.title}
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                {post.description}
              </p>
              <span className="inline-flex items-center gap-2 font-mono text-sm text-cyan-400 uppercase tracking-wider">
                Read article
                <span className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogListPage;
