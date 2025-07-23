import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SEOWrapper = ({ 
  title, 
  description, 
  image,
  type = 'website',
  additionalMeta = [],
  structuredData = null,
  canonical,
  noindex = false
}) => {
  const location = useLocation();
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://grapheneos-store.com';
  const currentUrl = `${siteUrl}${location.pathname}`;
  
  const defaultTitle = 'GrapheneOS Store - Privacy-Focused Smartphones';
  const defaultDescription = 'Buy Google Pixel phones pre-installed with GrapheneOS. Secure, private, and anonymous shopping with Bitcoin, Monero, and PayPal payment options.';
  const defaultImage = `${siteUrl}/og-image.jpg`;
  
  const fullTitle = title ? `${title} - GrapheneOS Store` : defaultTitle;
  const metaDescription = description || defaultDescription;
  const metaImage = image ? `${siteUrl}${image}` : defaultImage;
  const canonicalUrl = canonical || currentUrl;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content="GrapheneOS Store" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      
      {/* Additional meta tags */}
      {additionalMeta.map((meta, index) => (
        <meta key={index} {...meta} />
      ))}
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOWrapper;