---
name: load-testing
description: Perform load testing including stress testing, capacity planning, and performance benchmarking. Use when testing system capacity or planning for scale.
---

# Load Testing

Perform load testing.

## Quick Checklist

When load testing:

- [ ] **Test scenarios** defined
- [ ] **Load** levels determined
- [ ] **Metrics** collected
- [ ] **Bottlenecks** identified
- [ ] **Optimization** applied

## Load Testing Tools

### 1. k6 Load Testing

```javascript
// load-test.js
import http from "k6/http";
import { check } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 },
    { duration: "5m", target: 100 },
    { duration: "2m", target: 0 },
  ],
};

export default function () {
  const res = http.get("https://api.example.com/users");
  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });
}
```

## Best Practices

### ✅ Good Practices

- Start with low load
- Increase gradually
- Monitor metrics
- Identify bottlenecks
- Test realistic scenarios

### ❌ Anti-Patterns

- Don't test in production
- Don't skip monitoring
- Don't ignore results

## Related Rules

- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
