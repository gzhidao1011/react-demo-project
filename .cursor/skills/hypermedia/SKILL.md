---
name: hypermedia
description: Implement hypermedia APIs including HATEOAS, links, and resource navigation. Use when building RESTful APIs or implementing hypermedia controls.
---

# Hypermedia APIs

Implement hypermedia APIs.

## Quick Checklist

When implementing hypermedia:

- [ ] **Links** included in responses
- [ ] **HATEOAS** principles followed
- [ ] **Navigation** supported
- [ ] **Documentation** provided
- [ ] **Client** implementation

## Hypermedia Implementation

### 1. HATEOAS Response

```typescript
interface HypermediaResponse {
  data: unknown;
  links: {
    self: string;
    related?: string[];
    actions?: {
      [key: string]: {
        href: string;
        method: string;
      };
    };
  };
}

function createHypermediaResponse(data: unknown, baseUrl: string): HypermediaResponse {
  return {
    data,
    links: {
      self: `${baseUrl}/resource/${data.id}`,
      actions: {
        update: { href: `${baseUrl}/resource/${data.id}`, method: "PUT" },
        delete: { href: `${baseUrl}/resource/${data.id}`, method: "DELETE" },
      },
    },
  };
}
```

## Best Practices

### ✅ Good Practices

- Include links
- Follow HATEOAS
- Support navigation
- Document links
- Test navigation

### ❌ Anti-Patterns

- Don't skip links
- Don't ignore HATEOAS
- Don't forget documentation

## Related Rules

- API Development: `.cursor/skills/api-development/SKILL.md`
