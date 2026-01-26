---
name: load-balancing
description: Configure load balancing including round-robin, least connections, and health-based routing. Use when setting up load balancers or distributing traffic.
---

# Load Balancing

Configure load balancing strategies.

## Quick Checklist

When configuring load balancing:

- [ ] **Load balancer** configured
- [ ] **Strategy** selected
- [ ] **Health checks** configured
- [ ] **Session affinity** configured (if needed)
- [ ] **Monitoring** set up

## Nginx Load Balancing

### 1. Upstream Configuration

```nginx
upstream backend {
  least_conn;
  server backend1:8080;
  server backend2:8080;
  server backend3:8080;
}

server {
  location / {
    proxy_pass http://backend;
  }
}
```

## Best Practices

### ✅ Good Practices

- Use appropriate strategy
- Configure health checks
- Monitor backend health
- Handle failures gracefully
- Use session affinity when needed

### ❌ Anti-Patterns

- Don't ignore health checks
- Don't skip monitoring
- Don't use single backend

## Related Rules

- Deployment Operations: `.cursor/skills/deployment-operations/SKILL.md`
