---
name: containerization
description: Containerize applications using Docker including Dockerfile optimization, multi-stage builds, and container best practices. Use when containerizing applications or optimizing Docker images.
---

# Containerization

Containerize applications using Docker.

## Quick Checklist

When containerizing:

- [ ] **Dockerfile** created
- [ ] **Multi-stage build** used
- [ ] **Image size** optimized
- [ ] **Security** best practices followed
- [ ] **Health checks** configured
- [ ] **.dockerignore** configured

## Dockerfile Best Practices

### 1. Multi-stage Build

```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Best Practices

### ✅ Good Practices

- Use multi-stage builds
- Minimize image layers
- Use .dockerignore
- Set non-root user
- Add health checks
- Optimize cache usage

### ❌ Anti-Patterns

- Don't include dev dependencies
- Don't use latest tags
- Don't skip security updates
- Don't ignore image size

## Related Rules

- Deployment Operations: `.cursor/skills/deployment-operations/SKILL.md`
