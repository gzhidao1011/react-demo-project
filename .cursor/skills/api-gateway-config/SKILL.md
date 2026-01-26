---
name: api-gateway-config
description: Configure API gateway including routing, rate limiting, authentication, and request transformation. Use when configuring API gateway or managing API routing.
---

# API Gateway Configuration

Configure API gateway.

## Quick Checklist

When configuring gateway:

- [ ] **Routes** configured
- [ ] **Rate limiting** set
- [ ] **Authentication** configured
- [ ] **Request** transformation set
- [ ] **Monitoring** enabled

## Gateway Configuration

### 1. Route Configuration

```yaml
# api-gateway/routes.yml
routes:
  - path: /api/users
    target: http://user-service:8001
    rateLimit: 100/minute
    auth: required
  
  - path: /api/orders
    target: http://order-service:8002
    rateLimit: 50/minute
    auth: required
```

## Best Practices

### ✅ Good Practices

- Centralize routing
- Set rate limits
- Configure auth
- Monitor traffic
- Handle errors

### ❌ Anti-Patterns

- Don't skip rate limiting
- Don't ignore auth
- Don't skip monitoring

## Related Rules

- API Structure: `.cursor/rules/06-API结构.mdc`
