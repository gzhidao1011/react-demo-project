---
name: caching-strategy
description: Implement caching strategies including client-side caching, API response caching, browser cache headers, and cache invalidation. Use when optimizing performance, reducing API calls, or implementing caching mechanisms.
---

# Caching Strategy

Implement caching strategies to improve performance and reduce server load.

## Quick Checklist

When implementing caching:

- [ ] **Cache strategy** selected (memory, localStorage, sessionStorage)
- [ ] **Cache keys** are unique and descriptive
- [ ] **Cache expiration** configured
- [ ] **Cache invalidation** implemented
- [ ] **Cache headers** set correctly (server-side)
- [ ] **Error handling** for cache failures
- [ ] **Cache size** limits considered

## Client-Side Caching

### 1. Memory Cache

**✅ Recommended**: For frequently accessed data

```typescript
// packages/utils/src/cache.ts
class MemoryCache<T> {
  private cache = new Map<string, { data: T; expiresAt: number }>();

  set(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { data, expiresAt });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

export const memoryCache = new MemoryCache();
```

### 2. localStorage Cache

**Use for**: Persistent data across sessions

```typescript
class LocalStorageCache<T> {
  private prefix = "cache_";

  set(key: string, data: T, ttl: number = 24 * 60 * 60 * 1000): void {
    const item = {
      data,
      expiresAt: Date.now() + ttl,
    };
    
    try {
      localStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(item)
      );
    } catch (error) {
      // Handle quota exceeded
      console.warn("Cache storage failed:", error);
    }
  }

  get(key: string): T | null {
    try {
      const item = localStorage.getItem(`${this.prefix}${key}`);
      if (!item) return null;

      const parsed = JSON.parse(item);
      
      if (Date.now() > parsed.expiresAt) {
        this.delete(key);
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  }

  delete(key: string): void {
    localStorage.removeItem(`${this.prefix}${key}`);
  }

  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const localStorageCache = new LocalStorageCache();
```

### 3. Cache Hook

```tsx
// packages/hooks/src/useCache.ts
import { useState, useEffect, useCallback } from "react";
import { memoryCache } from "@repo/utils";

interface UseCacheOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttl?: number;
  enabled?: boolean;
}

export function useCache<T>({
  key,
  fetcher,
  ttl = 5 * 60 * 1000,
  enabled = true,
}: UseCacheOptions<T>) {
  const [data, setData] = useState<T | null>(() => {
    return memoryCache.get<T>(key);
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    // Check cache first
    const cached = memoryCache.get<T>(key);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await fetcher();
      
      // Store in cache
      memoryCache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  const invalidate = useCallback(() => {
    memoryCache.delete(key);
    setData(null);
    fetchData();
  }, [key, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    invalidate,
  };
}
```

## API Response Caching

### 1. Cached API Service

```typescript
// packages/services/src/api.service.base.ts
import { memoryCache } from "@repo/utils";

export class APIServiceBase {
  protected async request<T>(
    url: string,
    options: RequestInit = {},
    cacheOptions?: { ttl?: number; key?: string }
  ): Promise<T> {
    const cacheKey = cacheOptions?.key || url;
    
    // Check cache
    if (cacheOptions) {
      const cached = memoryCache.get<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Store in cache
    if (cacheOptions) {
      memoryCache.set(cacheKey, data, cacheOptions.ttl);
    }

    return data;
  }

  protected invalidateCache(pattern: string): void {
    // Clear cache entries matching pattern
    // Implementation depends on cache structure
  }
}
```

### 2. Usage Example

```typescript
// Cache user data for 5 minutes
const user = await apiService.request<User>(
  "/api/user/123",
  { method: "GET" },
  { ttl: 5 * 60 * 1000, key: "user:123" }
);

// Cache list data
const users = await apiService.request<User[]>(
  "/api/users",
  { method: "GET" },
  { ttl: 2 * 60 * 1000 }
);
```

## React Query Integration

### 1. Setup React Query

```tsx
// apps/web/app/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 2. Use Query Hook

```tsx
// packages/hooks/src/useUser.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@repo/services";

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => apiService.get<User>(`/api/user/${userId}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserRequest) =>
      apiService.put(`/api/user/${data.id}`, data),
    onSuccess: (_, variables) => {
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
```

## Cache Invalidation

### 1. Manual Invalidation

```typescript
// Invalidate specific cache entry
memoryCache.delete("user:123");

// Invalidate all user caches
const keys = Array.from(memoryCache.cache.keys());
keys.forEach((key) => {
  if (key.startsWith("user:")) {
    memoryCache.delete(key);
  }
});
```

### 2. Event-Based Invalidation

```typescript
// Invalidate cache on user update
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(["user", data.id], data);
      
      // Invalidate list cache
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
```

### 3. Time-Based Invalidation

```typescript
// Auto-invalidate expired entries
setInterval(() => {
  const now = Date.now();
  memoryCache.cache.forEach((value, key) => {
    if (now > value.expiresAt) {
      memoryCache.delete(key);
    }
  });
}, 60 * 1000); // Check every minute
```

## Browser Cache Headers

### 1. Server-Side Headers

```typescript
// Set cache headers in API response
res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour
res.setHeader("ETag", generateETag(data));
res.setHeader("Last-Modified", new Date().toUTCString());
```

### 2. Static Assets

```nginx
# nginx.conf
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

## Best Practices

### ✅ Good Practices

- Use memory cache for frequently accessed data
- Set appropriate TTL values
- Implement cache invalidation
- Use descriptive cache keys
- Handle cache failures gracefully
- Monitor cache hit rates
- Set cache size limits
- Use React Query for API caching

### ❌ Anti-Patterns

- Don't cache sensitive data
- Don't use infinite TTL
- Don't ignore cache invalidation
- Don't use generic cache keys
- Don't cache user-specific data globally
- Don't skip error handling
- Don't cache large objects in memory

## Cache Strategies

### 1. Cache-Aside (Lazy Loading)

```typescript
async function getData(key: string): Promise<Data> {
  // Check cache first
  let data = cache.get(key);
  
  if (!data) {
    // Fetch from API
    data = await fetchFromAPI(key);
    
    // Store in cache
    cache.set(key, data);
  }
  
  return data;
}
```

### 2. Write-Through

```typescript
async function updateData(key: string, data: Data): Promise<void> {
  // Update API
  await updateAPI(key, data);
  
  // Update cache
  cache.set(key, data);
}
```

### 3. Write-Behind (Write-Back)

```typescript
async function updateData(key: string, data: Data): Promise<void> {
  // Update cache immediately
  cache.set(key, data);
  
  // Queue API update
  queueAPIUpdate(key, data);
}
```

## Related Rules

- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
- API Structure: `.cursor/rules/06-API结构.mdc`
