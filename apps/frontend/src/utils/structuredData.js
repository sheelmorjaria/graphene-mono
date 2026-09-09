// Structured data baked into prerendered HTML — AI crawlers and Google read
// these. The default domain MUST match production (VITE_SITE_URL overrides in
// unusual environments).
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://graphene-security.com';

// The products API exposes no top-level price: offers live on variations[]
// (salePrice preferred) with a priceRange summary. Derive the advertised
// "from" price for the Offer schema.
const resolveOfferPrice = (product) => {
  const variationPrices = (product.variations || [])
    .map((variation) => variation.salePrice ?? variation.price)
    .filter((price) => Number.isFinite(price));
  if (variationPrices.length > 0) {
    return Math.min(...variationPrices);
  }
  return product.priceRange?.min ?? product.price;
};

export const generateProductStructuredData = (product) => {
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images?.map(img => `${SITE_URL}${img}`) || [],
    "description": product.description || product.shortDescription,
    "sku": product._id,
    "brand": {
      "@type": "Brand",
      "name": "Google"
    },
    "offers": {
      "@type": "Offer",
      "url": `${SITE_URL}/products/${product.slug}`,
      "priceCurrency": "GBP",
      "price": resolveOfferPrice(product),
      "availability": product.isInStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Graphene Security"
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
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Graphene Security",
    "url": SITE_URL,
    "logo": `${SITE_URL}/logo.png`,
    "description": "UK retailer of Google Pixel phones pre-installed with GrapheneOS, the privacy and security focused mobile operating system",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": `${SITE_URL}/contact-us`,
      "email": "support@graphene-security.com",
      "availableLanguage": ["en"]
    },
    // Deliberately NOT linking twitter.com/grapheneos or github.com/GrapheneOS:
    // sameAs asserts identity, and the store is a reseller, not the OS project.
    // Referencing the project's site here would conflate two distinct entities.
    "knowsAbout": [
      "GrapheneOS",
      "Google Pixel",
      "Privacy-focused smartphones",
      "De-googled Android"
    ]
  };
};

export const generateBreadcrumbStructuredData = (breadcrumbs) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url ? `${SITE_URL}${crumb.url}` : undefined
    }))
  };
};

export const generateSearchActionStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": SITE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${SITE_URL}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
};

// FAQPage schema for AI citation. Answers MUST be plain text — the visible
// FAQ renders JSX, so callers maintain a parallel plain-text list.
export const generateFAQStructuredData = (faqs) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": (faqs || []).map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};
