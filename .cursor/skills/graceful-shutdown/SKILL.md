---
name: graceful-shutdown
description: Implement graceful shutdown including connection cleanup, in-flight request handling, and resource cleanup. Use when implementing shutdown procedures or handling termination signals.
---

# Graceful Shutdown

Implement graceful shutdown procedures.

## Quick Checklist

When implementing shutdown:

- [ ] **Signal handlers** registered
- [ ] **In-flight requests** handled
- [ ] **Connections** closed
- [ ] **Resources** cleaned up
- [ ] **Shutdown timeout** set

## Shutdown Implementation

### 1. Graceful Shutdown

```typescript
let server: Server;
let isShuttingDown = false;

process.on("SIGTERM", () => {
  console.log("SIGTERM received, starting graceful shutdown");
  isShuttingDown = true;

  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown");
    process.exit(1);
  }, 10000);
});
```

## Best Practices

### ✅ Good Practices

- Handle termination signals
- Wait for in-flight requests
- Close connections gracefully
- Clean up resources
- Set shutdown timeout

### ❌ Anti-Patterns

- Don't kill processes immediately
- Don't skip cleanup
- Don't ignore signals

## Related Rules

- Deployment Operations: `.cursor/skills/deployment-operations/SKILL.md`
