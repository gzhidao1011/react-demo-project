---
name: search-functionality
description: Implement search functionality including full-text search, filtering, sorting, and search result highlighting. Use when implementing search features or filtering data.
---

# Search Functionality

Implement search functionality with filtering, sorting, and result highlighting.

## Quick Checklist

When implementing search:

- [ ] **Search input** component created
- [ ] **Debounce** implemented for performance
- [ ] **Filtering logic** implemented
- [ ] **Sorting** options added
- [ ] **Result highlighting** implemented
- [ ] **Empty state** handled
- [ ] **Loading state** shown

## Basic Search Hook

### 1. useSearch Hook

```tsx
// packages/hooks/src/useSearch.ts
import { useState, useMemo, useCallback } from "react";
import { debounce } from "lodash-es";

interface UseSearchOptions<T> {
  data: T[];
  searchKeys: (keyof T)[];
  debounceMs?: number;
  filterFn?: (item: T, query: string) => boolean;
}

export function useSearch<T>({
  data,
  searchKeys,
  debounceMs = 300,
  filterFn,
}: UseSearchOptions<T>) {
  const [query, setQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!query.trim()) return data;

    const lowerQuery = query.toLowerCase();

    if (filterFn) {
      return data.filter((item) => filterFn(item, lowerQuery));
    }

    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        return String(value).toLowerCase().includes(lowerQuery);
      })
    );
  }, [data, query, searchKeys, filterFn]);

  const debouncedSetQuery = useCallback(
    debounce((value: string) => {
      setQuery(value);
    }, debounceMs),
    [debounceMs]
  );

  const handleSearch = useCallback(
    (value: string) => {
      debouncedSetQuery(value);
    },
    [debouncedSetQuery]
  );

  const clearSearch = useCallback(() => {
    setQuery("");
    debouncedSetQuery.cancel();
  }, [debouncedSetQuery]);

  return {
    query,
    filteredData,
    handleSearch,
    clearSearch,
    resultCount: filteredData.length,
  };
}
```

### 2. Usage Example

```tsx
// apps/web/app/components/UserList.tsx
import { useSearch } from "@repo/hooks";

interface User {
  id: string;
  name: string;
  email: string;
}

export function UserList({ users }: { users: User[] }) {
  const { query, filteredData, handleSearch, resultCount } = useSearch({
    data: users,
    searchKeys: ["name", "email"],
  });

  return (
    <div>
      <input
        type="text"
        placeholder="搜索用户..."
        onChange={(e) => handleSearch(e.target.value)}
      />
      
      <p>找到 {resultCount} 个结果</p>
      
      <ul>
        {filteredData.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Advanced Search with Filters

### 1. Multi-Filter Hook

```tsx
// packages/hooks/src/useFilters.ts
import { useState, useMemo } from "react";

interface FilterConfig<T> {
  [key: string]: (item: T) => boolean;
}

export function useFilters<T>(data: T[], initialFilters: FilterConfig<T> = {}) {
  const [filters, setFilters] = useState<FilterConfig<T>>(initialFilters);

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      Object.values(filters).every((filterFn) => filterFn(item))
    );
  }, [data, filters]);

  const setFilter = useCallback(
    (key: string, filterFn: (item: T) => boolean | null) => {
      setFilters((prev) => {
        if (filterFn === null) {
          const { [key]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [key]: filterFn };
      });
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    filteredData,
    filters,
    setFilter,
    clearFilters,
    activeFilterCount: Object.keys(filters).length,
  };
}
```

### 2. Usage

```tsx
export function ProductList({ products }: { products: Product[] }) {
  const { query, filteredData: searchedData } = useSearch({
    data: products,
    searchKeys: ["name", "description"],
  });

  const { filteredData, setFilter, clearFilters } = useFilters(searchedData);

  const handleCategoryFilter = (category: string) => {
    setFilter("category", (item) => item.category === category);
  };

  const handlePriceFilter = (min: number, max: number) => {
    setFilter("price", (item) => item.price >= min && item.price <= max);
  };

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        onChange={(e) => handleSearch(e.target.value)}
      />

      {/* Filters */}
      <select onChange={(e) => handleCategoryFilter(e.target.value)}>
        <option value="">所有分类</option>
        <option value="electronics">电子产品</option>
        <option value="clothing">服装</option>
      </select>

      {/* Results */}
      <ul>
        {filteredData.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Search Result Highlighting

### 1. Highlight Component

```tsx
// apps/web/app/components/Highlight.tsx
interface HighlightProps {
  text: string;
  query: string;
  className?: string;
}

export function Highlight({ text, query, className }: HighlightProps) {
  if (!query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${query})`, "gi"));

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}
```

### 2. Usage

```tsx
export function SearchResults({ results, query }: { results: Item[]; query: string }) {
  return (
    <ul>
      {results.map((item) => (
        <li key={item.id}>
          <Highlight text={item.name} query={query} />
        </li>
      ))}
    </ul>
  );
}
```

## API-Based Search

### 1. Search API Hook

```tsx
// packages/hooks/src/useSearchAPI.ts
import { useState, useEffect } from "react";
import { debounce } from "lodash-es";
import { apiService } from "@repo/services";

interface UseSearchAPIOptions {
  endpoint: string;
  debounceMs?: number;
  minQueryLength?: number;
}

export function useSearchAPI<T>({
  endpoint,
  debounceMs = 300,
  minQueryLength = 2,
}: UseSearchAPIOptions) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < minQueryLength) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await apiService.get<T[]>(`${endpoint}?q=${encodeURIComponent(searchQuery)}`);
        setResults(data);
      } catch (err) {
        setError(err as Error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs),
    [endpoint, debounceMs, minQueryLength]
  );

  useEffect(() => {
    search(query);
    return () => {
      search.cancel();
    };
  }, [query, search]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
  };
}
```

## Best Practices

### ✅ Good Practices

- Debounce search input
- Show loading state
- Handle empty results
- Highlight search terms
- Filter on multiple fields
- Provide clear search feedback
- Use URL params for shareable searches

### ❌ Anti-Patterns

- Don't search on every keystroke
- Don't ignore loading states
- Don't forget empty states
- Don't search without debounce
- Don't skip error handling

## Related Rules

- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
- API Development: `.cursor/skills/api-development/SKILL.md`
