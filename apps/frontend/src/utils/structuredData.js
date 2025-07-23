export const generateProductStructuredData = (product) => {
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://grapheneos-store.com';
  
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images?.map(img => `${siteUrl}${img}`) || [],
    "description": product.description,
    "sku": product._id,
    "brand": {
      "@type": "Brand",
      "name": "Google"
    },
    "offers": {
      "@type": "Offer",
      "url": `${siteUrl}/products/${product.slug}`,
      "priceCurrency": "GBP",
      "price": product.price,
      "availability": product.inStock 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "GrapheneOS Store"
      },
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    "aggregateRating": product.averageRating ? {
      "@type": "AggregateRating",
      "ratingValue": product.averageRating,
      "reviewCount": product.numReviews || 0
    } : undefined
  };
};

export const generateOrganizationStructuredData = () => {
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://grapheneos-store.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "GrapheneOS Store",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "description": "Privacy-focused smartphone retailer specializing in Google Pixel phones pre-installed with GrapheneOS",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+44-XXXX-XXXX",
      "contactType": "customer service",
      "availableLanguage": ["en"]
    },
    "sameAs": [
      "https://twitter.com/grapheneos",
      "https://github.com/GrapheneOS"
    ]
  };
};

export const generateBreadcrumbStructuredData = (breadcrumbs) => {
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://grapheneos-store.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url ? `${siteUrl}${crumb.url}` : undefined
    }))
  };
};

export const generateSearchActionStructuredData = () => {
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://grapheneos-store.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
};