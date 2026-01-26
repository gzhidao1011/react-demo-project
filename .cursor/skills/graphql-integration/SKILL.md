---
name: graphql-integration
description: Implement GraphQL integration including schema definition, resolvers, and GraphQL clients. Use when integrating GraphQL APIs or building GraphQL services.
---

# GraphQL Integration

Implement GraphQL integration.

## Quick Checklist

When integrating GraphQL:

- [ ] **GraphQL client** configured
- [ ] **Schema** defined
- [ ] **Queries** implemented
- [ ] **Mutations** implemented
- [ ] **Error handling** added

## GraphQL Client Setup

### 1. Apollo Client

```typescript
import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  uri: "/graphql",
  cache: new InMemoryCache(),
});
```

## Best Practices

### ✅ Good Practices

- Use GraphQL for complex queries
- Implement proper error handling
- Use fragments for reusability
- Optimize queries
- Cache appropriately

### ❌ Anti-Patterns

- Don't over-fetch data
- Don't skip error handling
- Don't ignore performance

## Related Rules

- API Development: `.cursor/skills/api-development/SKILL.md`
