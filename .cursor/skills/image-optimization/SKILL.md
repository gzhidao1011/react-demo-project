---
name: image-optimization
description: Implement image optimization including lazy loading, responsive images, format conversion, and performance optimization. Use when optimizing images or improving page load performance.
---

# Image Optimization

Implement image optimization for better performance and user experience.

## Quick Checklist

When optimizing images:

- [ ] **Lazy loading** implemented
- [ ] **Responsive images** configured
- [ ] **Image formats** optimized (WebP, AVIF)
- [ ] **Image compression** applied
- [ ] **Placeholder** images used
- [ ] **Error handling** for failed loads
- [ ] **Loading states** shown

## Lazy Loading

### 1. Lazy Image Component

```tsx
// apps/web/app/components/LazyImage.tsx
import { useState, useRef, useEffect } from "react";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
}

export function LazyImage({
  src,
  alt,
  placeholder,
  fallback,
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder || "");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "50px" }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    if (fallback) {
      setImageSrc(fallback);
    }
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      onLoad={handleLoad}
      onError={handleError}
      className={`${props.className || ""} ${isLoaded ? "loaded" : "loading"}`}
      loading="lazy"
      {...props}
    />
  );
}
```

### 2. Usage

```tsx
<LazyImage
  src="/images/product.jpg"
  alt="Product"
  placeholder="/images/placeholder.jpg"
  fallback="/images/error.jpg"
/>
```

## Responsive Images

### 1. Responsive Image Component

```tsx
// apps/web/app/components/ResponsiveImage.tsx
interface ResponsiveImageProps {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  width?: number;
  height?: number;
}

export function ResponsiveImage({
  src,
  srcSet,
  sizes,
  alt,
  width,
  height,
}: ResponsiveImageProps) {
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
    />
  );
}
```

### 2. Usage with srcSet

```tsx
<ResponsiveImage
  src="/images/hero.jpg"
  srcSet="/images/hero-small.jpg 480w, /images/hero-medium.jpg 768w, /images/hero-large.jpg 1200w"
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="Hero image"
/>
```

## Image Format Conversion

### 1. Image Format Detection

```typescript
// packages/utils/src/image-utils.ts
export function getOptimalImageFormat(): string {
  if (typeof window === "undefined") return "jpg";

  // Check AVIF support
  const avif = new Image();
  avif.src =
    "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=";
  
  return new Promise((resolve) => {
    avif.onload = () => resolve("avif");
    avif.onerror = () => {
      // Check WebP support
      const webp = new Image();
      webp.src =
        "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
      webp.onload = () => resolve("webp");
      webp.onerror = () => resolve("jpg");
    };
  });
}
```

## Image Compression Hook

### 1. useImageCompression Hook

```tsx
// packages/hooks/src/useImageCompression.ts
import { useState, useCallback } from "react";
import { compressImage } from "@repo/utils";

interface UseImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSize?: number;
}

export function useImageCompression(options: UseImageCompressionOptions = {}) {
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const compress = useCallback(
    async (file: File): Promise<File> => {
      try {
        setCompressing(true);
        setError(null);
        return await compressImage(file, options);
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setCompressing(false);
      }
    },
    [options]
  );

  return {
    compress,
    compressing,
    error,
  };
}
```

## Best Practices

### ✅ Good Practices

- Use lazy loading for below-fold images
- Provide responsive images with srcSet
- Use modern formats (WebP, AVIF)
- Compress images before upload
- Use placeholders during loading
- Handle image load errors
- Set explicit width/height to prevent layout shift

### ❌ Anti-Patterns

- Don't load all images immediately
- Don't use large images for thumbnails
- Don't skip image compression
- Don't ignore responsive images
- Don't forget error handling

## Related Rules

- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
- Component Development: `.cursor/skills/component-development/SKILL.md`
