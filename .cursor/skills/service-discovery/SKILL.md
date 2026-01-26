---
name: service-discovery
description: Implement service discovery including service registration, health checks, and load balancing. Use when setting up microservices or service mesh.
---

# Service Discovery

Implement service discovery for microservices.

## Quick Checklist

When implementing service discovery:

- [ ] **Service registry** configured
- [ ] **Service registration** implemented
- [ ] **Health checks** configured
- [ ] **Load balancing** set up
- [ ] **Service discovery** client configured

## Nacos Service Discovery

### 1. Service Registration

```yaml
# application.yml
spring:
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
        namespace: default
        group: DEFAULT_GROUP
```

## Best Practices

### ✅ Good Practices

- Register services on startup
- Implement health checks
- Use service discovery client
- Handle service failures
- Monitor service health

### ❌ Anti-Patterns

- Don't hardcode service URLs
- Don't skip health checks
- Don't ignore service failures

## Related Rules

- Service Integration: `.cursor/skills/service-integration/SKILL.md`
