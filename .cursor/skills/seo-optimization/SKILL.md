---
name: seo-optimization
description: Implement SEO optimization including meta tags, structured data, sitemap generation, and performance optimization. Use when optimizing for search engines.
---

# SEO Optimization

Implement SEO optimization for better search engine visibility.

## Quick Checklist

When optimizing SEO:

- [ ] **Meta tags** configured
- [ ] **Structured data** added
- [ ] **Sitemap** generated
- [ ] **Robots.txt** configured
- [ ] **Open Graph** tags added
- [ ] **Performance** optimized
- [ ] **Mobile-friendly** verified

## Meta Tags

### 1. SEO Component

```tsx
// apps/web/app/components/SEO.tsx
interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export function SEO({
  title = "Default Title",
  description = "Default Description",
  keywords,
  image,
  url,
}: SEOProps) {
  const fullTitle = `${title} | Site Name`;
  const fullUrl = url || window.location.href;
  const fullImage = image || `${window.location.origin}/og-image.jpg`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content="website" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
    </>
  );
}
```

### 2. Usage

```tsx
export function ProductPage({ product }: { product: Product }) {
  return (
    <>
      <SEO
        title={product.name}
        description={product.description}
        image={product.image}
        url={`/products/${product.id}`}
      />
      {/* Page content */}
    </>
  );
}
```

## Structured Data

### 1. JSON-LD Component

```tsx
// apps/web/app/components/StructuredData.tsx
interface StructuredDataProps {
  data: Record<string, unknown>;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

### 2. Product Structured Data

```tsx
export function ProductPage({ product }: { product: Product }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "CNY",
    },
  };

  return (
    <>
      <StructuredData data={structuredData} />
      {/* Page content */}
    </>
  );
}
```

## Sitemap Generation

### 1. Generate Sitemap

```typescript
// scripts/generate-sitemap.ts
import { writeFileSync } from "fs";

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

export function generateSitemap(entries: SitemapEntry[]) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${entry.url}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ""}
    ${entry.priority ? `<priority>${entry.priority}</priority>` : ""}
  </url>`
  )
  .join("\n")}
</urlset>`;

  writeFileSync("public/sitemap.xml", sitemap);
}
```

## Robots.txt

### 1. Robots.txt

```txt
# public/robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://example.com/sitemap.xml
```

## Best Practices

### ✅ Good Practices

- Use descriptive titles and descriptions
- Add structured data
- Generate sitemap
- Configure robots.txt
- Optimize images with alt text
- Use semantic HTML
- Ensure fast page load

### ❌ Anti-Patterns

- Don't use duplicate content
- Don't skip meta tags
- Don't ignore mobile optimization
- Don't use keyword stuffing
- Don't skip structured data

## Related Rules

- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
- Component Development: `.cursor/skills/component-development/SKILL.md`
