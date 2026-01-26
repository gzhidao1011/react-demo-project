---
name: environment-management
description: Manage environment variables, configuration files, and environment-specific settings. Use when configuring environments or managing secrets.
---

# Environment Management

Manage environment variables and configuration.

## Quick Checklist

When managing environments:

- [ ] **Environment files** created (.env.local, .env.production)
- [ ] **Variables** documented
- [ ] **Secrets** stored securely
- [ ] **Validation** implemented
- [ ] **Type safety** ensured
- [ ] **Default values** provided

## Environment Variables

### 1. Environment Configuration

```typescript
// apps/web/app/config/env.ts
interface EnvConfig {
  apiUrl: string;
  apiKey: string;
  environment: "development" | "staging" | "production";
  enableAnalytics: boolean;
}

function validateEnv(): EnvConfig {
  const required = ["VITE_API_URL", "VITE_API_KEY"];
  
  for (const key of required) {
    if (!import.meta.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return {
    apiUrl: import.meta.env.VITE_API_URL,
    apiKey: import.meta.env.VITE_API_KEY,
    environment: (import.meta.env.MODE || "development") as EnvConfig["environment"],
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
  };
}

export const env = validateEnv();
```

### 2. Environment Files

```bash
# .env.local
VITE_API_URL=http://localhost:8080
VITE_API_KEY=dev-key
VITE_ENABLE_ANALYTICS=false

# .env.production
VITE_API_URL=https://api.example.com
VITE_ENABLE_ANALYTICS=true
```

## Type-Safe Environment

### 1. Zod Schema Validation

```typescript
// apps/web/app/config/env.ts
import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_API_KEY: z.string().min(1),
  VITE_ENABLE_ANALYTICS: z.string().transform((val) => val === "true"),
});

export const env = envSchema.parse(import.meta.env);
```

## Best Practices

### ✅ Good Practices

- Validate environment variables
- Use type-safe access
- Document required variables
- Store secrets securely
- Provide defaults where appropriate
- Use different files per environment

### ❌ Anti-Patterns

- Don't commit .env files
- Don't use env vars without validation
- Don't expose secrets
- Don't skip type safety

## Related Rules

- Security: `.cursor/rules/21-安全规范.mdc`
- Environment Setup: `.cursor/skills/environment-setup/SKILL.md`
