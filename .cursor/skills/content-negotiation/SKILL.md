---
name: content-negotiation
description: Implement content negotiation including Accept headers, content types, and format selection. Use when supporting multiple formats or implementing content negotiation.
---

# Content Negotiation

Implement content negotiation.

## Quick Checklist

When implementing negotiation:

- [ ] **Formats** supported
- [ ] **Accept** headers handled
- [ ] **Content-Type** set correctly
- [ ] **Default** format defined
- [ ] **Error** handling added

## Content Negotiation

### 1. Format Selection

```typescript
function negotiateContentType(request: Request): string {
  const accept = request.headers.get("accept") || "";
  
  if (accept.includes("application/json")) {
    return "application/json";
  }
  if (accept.includes("application/xml")) {
    return "application/xml";
  }
  
  return "application/json"; // Default
}
```

## Best Practices

### ✅ Good Practices

- Support multiple formats
- Handle Accept headers
- Set Content-Type
- Provide defaults
- Document formats

### ❌ Anti-Patterns

- Don't ignore Accept headers
- Don't skip Content-Type
- Don't forget defaults

## Related Rules

- API Development: `.cursor/skills/api-development/SKILL.md`
