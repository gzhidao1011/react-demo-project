---
name: analytics-tracking
description: Implement analytics tracking including page views, user events, conversion tracking, and performance monitoring. Use when implementing analytics or tracking user behavior.
---

# Analytics Tracking

Implement analytics tracking for user behavior and performance monitoring.

## Quick Checklist

When implementing analytics:

- [ ] **Analytics provider** selected (Google Analytics, etc.)
- [ ] **Page view tracking** implemented
- [ ] **Event tracking** configured
- [ ] **User identification** set up
- [ ] **Privacy compliance** ensured
- [ ] **Error tracking** integrated
- [ ] **Performance monitoring** added

## Google Analytics Setup

### 1. Install Google Analytics

```bash
pnpm add @react-ga4/react-ga4
```

### 2. Analytics Provider

```tsx
// apps/web/app/providers/AnalyticsProvider.tsx
import { useEffect } from "react";
import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = process.env.VITE_GA_MEASUREMENT_ID || "";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (GA_MEASUREMENT_ID) {
      ReactGA.initialize(GA_MEASUREMENT_ID);
    }
  }, []);

  return <>{children}</>;
}
```

### 3. Page View Tracking

```tsx
// apps/web/app/hooks/usePageView.ts
import { useEffect } from "react";
import { useLocation } from "react-router";
import ReactGA from "react-ga4";

export function usePageView() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
  }, [location]);
}
```

### 4. Event Tracking Hook

```tsx
// packages/hooks/src/useAnalytics.ts
import { useCallback } from "react";
import ReactGA from "react-ga4";

interface TrackEventOptions {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

export function useAnalytics() {
  const trackEvent = useCallback((options: TrackEventOptions) => {
    ReactGA.event({
      category: options.category,
      action: options.action,
      label: options.label,
      value: options.value,
    });
  }, []);

  const trackPageView = useCallback((path: string) => {
    ReactGA.send({ hitType: "pageview", page: path });
  }, []);

  const setUser = useCallback((userId: string) => {
    ReactGA.set({ userId });
  }, []);

  return {
    trackEvent,
    trackPageView,
    setUser,
  };
}
```

### 5. Usage

```tsx
import { useAnalytics } from "@repo/hooks";

export function ProductCard({ product }: { product: Product }) {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent({
      category: "Product",
      action: "Click",
      label: product.id,
    });
  };

  return <div onClick={handleClick}>{product.name}</div>;
}
```

## Custom Analytics Hook

### 1. Generic Analytics Hook

```tsx
// packages/hooks/src/useAnalytics.ts
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
}

export function useAnalytics() {
  const track = useCallback(async (event: AnalyticsEvent) => {
    // Send to analytics endpoint
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: event.name,
          properties: event.properties,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        }),
      });
    } catch (error) {
      console.error("Analytics tracking failed:", error);
    }
  }, []);

  return { track };
}
```

## Best Practices

### ✅ Good Practices

- Track meaningful user actions
- Respect user privacy preferences
- Use consistent event naming
- Include relevant context
- Handle tracking errors gracefully
- Comply with GDPR/CCPA
- Use user IDs for tracking

### ❌ Anti-Patterns

- Don't track sensitive information
- Don't track without consent
- Don't use inconsistent naming
- Don't ignore privacy regulations
- Don't track too frequently

## Related Rules

- Security: `.cursor/rules/21-安全规范.mdc`
- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
