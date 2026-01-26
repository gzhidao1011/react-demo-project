---
name: performance-monitoring
description: Implement performance monitoring including Web Vitals tracking, performance metrics, and performance optimization insights. Use when monitoring app performance or optimizing load times.
---

# Performance Monitoring

Implement performance monitoring for web applications.

## Quick Checklist

When implementing performance monitoring:

- [ ] **Web Vitals** tracked
- [ ] **Performance metrics** collected
- [ ] **Real User Monitoring** (RUM) set up
- [ ] **Performance budgets** defined
- [ ] **Performance alerts** configured
- [ ] **Performance reports** generated

## Web Vitals Tracking

### 1. Install Web Vitals

```bash
pnpm add web-vitals
```

### 2. Track Web Vitals

```tsx
// apps/web/app/hooks/useWebVitals.ts
import { useEffect } from "react";
import { onCLS, onFID, onFCP, onLCP, onTTFB } from "web-vitals";
import { analytics } from "@repo/utils";

export function useWebVitals() {
  useEffect(() => {
    onCLS((metric) => {
      analytics.track("web_vital", {
        name: "CLS",
        value: metric.value,
        id: metric.id,
      });
    });

    onFID((metric) => {
      analytics.track("web_vital", {
        name: "FID",
        value: metric.value,
        id: metric.id,
      });
    });

    onFCP((metric) => {
      analytics.track("web_vital", {
        name: "FCP",
        value: metric.value,
        id: metric.id,
      });
    });

    onLCP((metric) => {
      analytics.track("web_vital", {
        name: "LCP",
        value: metric.value,
        id: metric.id,
      });
    });

    onTTFB((metric) => {
      analytics.track("web_vital", {
        name: "TTFB",
        value: metric.value,
        id: metric.id,
      });
    });
  }, []);
}
```

## Performance Monitoring Hook

### 1. usePerformanceMonitoring Hook

```tsx
// packages/hooks/src/usePerformanceMonitoring.ts
import { useEffect } from "react";

export function usePerformanceMonitoring() {
  useEffect(() => {
    // Monitor page load time
    window.addEventListener("load", () => {
      const perfData = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      
      const metrics = {
        dns: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcp: perfData.connectEnd - perfData.connectStart,
        request: perfData.responseStart - perfData.requestStart,
        response: perfData.responseEnd - perfData.responseStart,
        dom: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        load: perfData.loadEventEnd - perfData.loadEventStart,
      };

      // Send to analytics
      console.log("Performance metrics:", metrics);
    });
  }, []);
}
```

## Best Practices

### ✅ Good Practices

- Track Core Web Vitals
- Monitor real user metrics
- Set performance budgets
- Alert on performance regressions
- Analyze performance trends

### ❌ Anti-Patterns

- Don't ignore Web Vitals
- Don't skip performance monitoring
- Don't forget to analyze data

## Related Rules

- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
- Analytics Tracking: `.cursor/skills/analytics-tracking/SKILL.md`
