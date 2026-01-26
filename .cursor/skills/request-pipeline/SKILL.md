---
name: request-pipeline
description: Implement request pipeline including middleware, request transformation, and response transformation. Use when building request pipelines or implementing middleware.
---

# Request Pipeline

Implement request pipeline.

## Quick Checklist

When implementing pipeline:

- [ ] **Middleware** configured
- [ ] **Order** defined
- [ ] **Error** handling added
- [ ] **Logging** implemented
- [ ] **Performance** monitored

## Pipeline Implementation

### 1. Middleware Chain

```typescript
type Middleware = (req: Request, next: () => Promise<Response>) => Promise<Response>;

class Pipeline {
  private middlewares: Middleware[] = [];

  use(middleware: Middleware) {
    this.middlewares.push(middleware);
  }

  async execute(req: Request): Promise<Response> {
    let index = 0;
    const next = async (): Promise<Response> => {
      if (index >= this.middlewares.length) {
        return new Response("Not found", { status: 404 });
      }
      return this.middlewares[index++](req, next);
    };
    return next();
  }
}
```

## Best Practices

### ✅ Good Practices

- Order middleware correctly
- Handle errors
- Log requests
- Monitor performance
- Keep middleware focused

### ❌ Anti-Patterns

- Don't skip error handling
- Don't ignore order
- Don't make middleware heavy

## Related Rules

- API Development: `.cursor/skills/api-development/SKILL.md`
