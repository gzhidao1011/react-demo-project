---
name: config-management
description: Manage application configuration including centralized config, environment-specific configs, and dynamic configuration. Use when managing application settings or configuration.
---

# Config Management

Manage application configuration.

## Quick Checklist

When managing config:

- [ ] **Config structure** defined
- [ ] **Environment configs** created
- [ ] **Validation** implemented
- [ ] **Hot reload** configured (if needed)
- [ ] **Secrets** managed securely

## Configuration Structure

### 1. Config Schema

```typescript
import { z } from "zod";

const configSchema = z.object({
  api: z.object({
    baseUrl: z.string().url(),
    timeout: z.number().default(5000),
  }),
  database: z.object({
    host: z.string(),
    port: z.number(),
  }),
});

export const config = configSchema.parse(process.env);
```

## Best Practices

### ✅ Good Practices

- Use schema validation
- Separate by environment
- Store secrets securely
- Document configuration
- Support hot reload

### ❌ Anti-Patterns

- Don't hardcode config
- Don't skip validation
- Don't expose secrets

## Related Rules

- Environment Management: `.cursor/skills/environment-management/SKILL.md`
