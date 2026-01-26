---
name: performance-optimization
description: Optimize application performance including React rendering, bundle size, API calls, and database queries. Use when optimizing performance, analyzing bottlenecks, or improving application speed.
---

# Performance Optimization

Optimize application performance following project standards and best practices.

## Quick Checklist

When optimizing performance:

- [ ] **Identify bottlenecks** using performance profiling tools
- [ ] **Bundle size** analyzed and optimized
- [ ] **React rendering** optimized (memoization, lazy loading)
- [ ] **API calls** optimized (caching, debouncing, pagination)
- [ ] **Images** optimized (lazy loading, compression, formats)
- [ ] **Database queries** optimized (indexes, query optimization)
- [ ] **Code splitting** implemented where appropriate
- [ ] **Caching** strategy implemented

## React Performance Optimization

### 1. Component Memoization

```tsx
import { memo, useMemo, useCallback } from "react";

// Memoize expensive components
const ExpensiveComponent = memo(({ data }: { data: Data[] }) => {
  // Component logic
});

// Memoize expensive calculations
const Component = ({ items }: { items: Item[] }) => {
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => a.value - b.value);
  }, [items]);

  return <div>{/* Use sortedItems */}</div>;
};

// Memoize callbacks
const Component = ({ onAction }: { onAction: (id: string) => void }) => {
  const handleClick = useCallback((id: string) => {
    onAction(id);
  }, [onAction]);

  return <button onClick={() => handleClick("123")}>Click</button>;
};
```

### 2. Code Splitting and Lazy Loading

```tsx
import { lazy, Suspense } from "react";

// Lazy load components
const HeavyComponent = lazy(() => import("./HeavyComponent"));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### 3. Virtual Scrolling for Large Lists

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: "400px", overflow: "auto" }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. Avoid Unnecessary Re-renders

```tsx
// ❌ Bad: Creates new object on every render
function Component() {
  const style = { color: "red" };
  return <div style={style}>Content</div>;
}

// ✅ Good: Use useMemo or constant
const style = { color: "red" };
function Component() {
  return <div style={style}>Content</div>;
}

// ❌ Bad: Inline function creates new function on every render
<button onClick={() => handleClick(id)}>Click</button>;

// ✅ Good: Use useCallback
const handleClick = useCallback(() => {
  // Handle click
}, [dependencies]);
```

## Bundle Size Optimization

### 1. Analyze Bundle Size

```bash
# Analyze bundle size
pnpm build
pnpm --filter @repo/web build --analyze

# Check bundle size in production build
pnpm build:analyze
```

### 2. Tree Shaking

```typescript
// ✅ Good: Import only what you need
import { debounce } from "lodash-es";

// ❌ Bad: Import entire library
import _ from "lodash";
```

### 3. Dynamic Imports

```tsx
// Dynamic import for heavy libraries
const loadHeavyLibrary = async () => {
  const module = await import("heavy-library");
  return module.default;
};
```

### 4. Remove Unused Dependencies

```bash
# Check for unused dependencies
pnpm why <package-name>

# Remove unused dependencies
pnpm remove <package-name>
```

## API Performance Optimization

### 1. Request Debouncing

```typescript
import { debounce } from "lodash-es";

const debouncedSearch = debounce(async (query: string) => {
  const results = await searchAPI(query);
  setResults(results);
}, 300);

// Use in input handler
<input onChange={(e) => debouncedSearch(e.target.value)} />;
```

### 2. Request Caching

```typescript
import { useQuery } from "@tanstack/react-query";

// React Query handles caching automatically
const { data } = useQuery({
  queryKey: ["user", userId],
  queryFn: () => fetchUser(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### 3. Pagination

```typescript
// Implement pagination for large datasets
const fetchPaginatedData = async (page: number, pageSize: number) => {
  const response = await api.get("/data", {
    params: { page, pageSize },
  });
  return response.data;
};
```

### 4. Request Batching

```typescript
// Batch multiple requests
const fetchMultipleUsers = async (userIds: string[]) => {
  const requests = userIds.map((id) => fetchUser(id));
  return Promise.all(requests);
};
```

## Image Optimization

### 1. Lazy Loading

```tsx
<img
  src="image.jpg"
  loading="lazy"
  alt="Description"
/>
```

### 2. Responsive Images

```tsx
<img
  srcSet="image-small.jpg 480w, image-medium.jpg 768w, image-large.jpg 1200w"
  sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
  src="image-medium.jpg"
  alt="Description"
/>
```

### 3. Modern Image Formats

```tsx
<picture>
  <source srcSet="image.avif" type="image/avif" />
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Description" />
</picture>
```

## Database Query Optimization

### 1. Add Indexes

```sql
-- Add index for frequently queried columns
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_order_user_id ON orders(user_id);
```

### 2. Optimize Queries

```sql
-- ❌ Bad: Select all columns
SELECT * FROM users WHERE email = ?;

-- ✅ Good: Select only needed columns
SELECT id, name, email FROM users WHERE email = ?;

-- ❌ Bad: N+1 queries
SELECT * FROM orders;
-- Then for each order: SELECT * FROM users WHERE id = ?;

-- ✅ Good: Use JOIN
SELECT o.*, u.name, u.email
FROM orders o
JOIN users u ON o.user_id = u.id;
```

### 3. Use Pagination

```typescript
// Limit results
const query = `
  SELECT * FROM orders
  WHERE user_id = ?
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?
`;
```

## Performance Monitoring

### 1. React DevTools Profiler

```tsx
import { Profiler } from "react";

function onRenderCallback(id, phase, actualDuration) {
  console.log("Component:", id, "Phase:", phase, "Duration:", actualDuration);
}

<Profiler id="App" onRender={onRenderCallback}>
  <App />
</Profiler>;
```

### 2. Web Vitals

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

function sendToAnalytics(metric) {
  // Send to analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 3. Performance API

```typescript
// Measure performance
const start = performance.now();
// Do work
const end = performance.now();
console.log(`Duration: ${end - start}ms`);

// Measure API call
const measureAPI = async () => {
  const start = performance.now();
  await fetch("/api/data");
  const end = performance.now();
  console.log(`API call took ${end - start}ms`);
};
```

## Best Practices

### ✅ Good Practices

- Use React.memo for expensive components
- Implement code splitting for large bundles
- Use virtual scrolling for long lists
- Debounce/throttle user input
- Cache API responses
- Optimize images (lazy loading, modern formats)
- Add database indexes
- Monitor performance metrics

### ❌ Anti-Patterns

- Don't create new objects/functions in render
- Don't load all data at once
- Don't ignore bundle size
- Don't make unnecessary API calls
- Don't load heavy libraries synchronously
- Don't forget to add database indexes

## Performance Checklist

Before deploying:

- [ ] Bundle size analyzed and optimized
- [ ] Images optimized and lazy loaded
- [ ] API calls debounced/throttled where needed
- [ ] Database queries optimized
- [ ] React components memoized where appropriate
- [ ] Code splitting implemented
- [ ] Caching strategy in place
- [ ] Performance metrics monitored

## Related Rules

- Code Style: `.cursor/rules/01-代码风格.mdc`
- Component Development: `.cursor/skills/component-development/SKILL.md`
