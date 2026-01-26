---
name: code-splitting
description: Implement code splitting including route-based splitting, component lazy loading, and dynamic imports. Use when optimizing bundle size or improving load performance.
---

# Code Splitting

Implement code splitting for better performance.

## Quick Checklist

When implementing code splitting:

- [ ] **Route-based splitting** implemented
- [ ] **Component lazy loading** added
- [ ] **Dynamic imports** used
- [ ] **Loading states** handled
- [ ] **Error boundaries** added
- [ ] **Bundle analysis** performed

## Route-Based Splitting

### 1. Lazy Load Routes

```tsx
// apps/web/app/routes.ts
import { lazy } from "react";
import { createBrowserRouter } from "react-router";

const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/dashboard",
    element: (
      <Suspense fallback={<Loading />}>
        <Dashboard />
      </Suspense>
    ),
  },
  {
    path: "/profile",
    element: (
      <Suspense fallback={<Loading />}>
        <Profile />
      </Suspense>
    ),
  },
]);
```

## Component Lazy Loading

### 1. Lazy Component Hook

```tsx
// packages/hooks/src/useLazyComponent.ts
import { lazy, Suspense, ComponentType } from "react";

export function useLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(importFn);

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
}
```

### 2. Usage

```tsx
const HeavyComponent = useLazyComponent(() => import("./HeavyComponent"));

export function App() {
  return <HeavyComponent prop1="value" />;
}
```

## Dynamic Imports

### 1. Conditional Loading

```tsx
export function Chart({ type }: { type: "line" | "bar" }) {
  const [ChartComponent, setChartComponent] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (type === "line") {
      import("./LineChart").then((mod) => setChartComponent(() => mod.default));
    } else {
      import("./BarChart").then((mod) => setChartComponent(() => mod.default));
    }
  }, [type]);

  if (!ChartComponent) return <div>Loading chart...</div>;

  return <ChartComponent />;
}
```

## Best Practices

### ✅ Good Practices

- Split by route
- Lazy load heavy components
- Use Suspense boundaries
- Provide loading states
- Analyze bundle size
- Preload critical routes

### ❌ Anti-Patterns

- Don't split too granularly
- Don't skip loading states
- Don't ignore bundle size
- Don't lazy load above-fold content

## Related Rules

- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
- Routing Configuration: `.cursor/skills/routing-configuration/SKILL.md`
