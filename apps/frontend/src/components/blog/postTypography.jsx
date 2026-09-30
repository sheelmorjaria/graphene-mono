import { Link } from 'react-router-dom';

// Shared long-form typography for blog posts. Every post component in
// src/components/blog/ uses these so the whole section reads as one voice —
// terminal-styled section numbers, cyan bullet markers, the closing CTA pair.

export const SectionHeading = ({ id, index, children }) => (
  <h2
    id={id}
    className="group mt-14 mb-6 flex items-baseline gap-3 font-heading text-2xl sm:text-3xl font-bold text-text-primary tracking-tight"
  >
    <span className="font-mono text-sm text-cyan-400/70 tracking-widest">{index}</span>
    <span className="border-b-2 border-transparent group-hover:border-cyan-400/40 transition-colors duration-200">
      {children}
    </span>
  </h2>
);

export const Paragraph = ({ children }) => (
  <p className="mb-6 text-lg leading-relaxed text-text-secondary">{children}</p>
);

export const Bullet = ({ children }) => (
  <li className="flex items-start gap-3 mb-3">
    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0"></span>
    <span className="leading-relaxed text-text-secondary">{children}</span>
  </li>
);

// Numbered how-to steps — list-inside decimal markers with cyan numbering.
export const NumberedSteps = ({ children }) => (
  <ol className="mb-6 space-y-3 list-decimal list-inside marker:font-mono marker:text-cyan-400">
    {children}
  </ol>
);

export const NumberedStep = ({ lead, children }) => (
  <li className="pl-1 leading-relaxed text-text-secondary">
    {lead ? <strong className="text-text-primary">{lead}</strong> : null}
    {lead && children ? ' ' : null}
    {children}
  </li>
);

// Yellow callout for warnings — same treatment as the flash service page's
// "Before you send your device" block.
export const WarningCallout = ({ title, children }) => (
  <div className="mb-6 p-5 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
    <h3 className="text-sm font-heading font-semibold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      {title}
    </h3>
    <ul className="space-y-2 text-sm text-text-secondary">{children}</ul>
  </div>
);

// Closing CTA pair every post ends with — storefront + flash service.
export const BlogPostCTA = ({
  primaryLabel = 'Secure Your Phone Today',
  secondaryLabel = 'Learn About Our Flash Service'
}) => (
  <div className="flex flex-col sm:flex-row gap-4 p-6 rounded-lg border border-cyan-400/20 bg-gradient-to-br from-cyan-400/5 to-matrix-400/5">
    <Link
      to="/products"
      className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-gradient-to-r from-cyan-400 to-matrix-400 text-text-on-accent font-heading font-semibold text-sm uppercase tracking-wider hover:shadow-glow-cyan transition-all duration-200"
    >
      {primaryLabel}
    </Link>
    <Link
      to="/flash-service"
      className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-cyan-400/40 text-cyan-400 font-heading font-semibold text-sm uppercase tracking-wider hover:bg-cyan-400/10 transition-all duration-200"
    >
      {secondaryLabel}
    </Link>
  </div>
);
