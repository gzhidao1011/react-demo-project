---
name: monitoring-alerts
description: Set up monitoring and alerting including metrics collection, alert rules, and notification channels. Use when setting up monitoring or configuring alerts.
---

# Monitoring & Alerts

Set up monitoring and alerting systems.

## Quick Checklist

When setting up monitoring:

- [ ] **Metrics** collected
- [ ] **Dashboards** created
- [ ] **Alert rules** configured
- [ ] **Notification** channels set up
- [ ] **Alert testing** performed

## Alert Configuration

### 1. Alert Rules

```yaml
# prometheus/alerts.yml
groups:
  - name: application
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High error rate detected"
```

## Best Practices

### ✅ Good Practices

- Set meaningful thresholds
- Avoid alert fatigue
- Test alerts
- Use multiple channels
- Document alert purpose

### ❌ Anti-Patterns

- Don't set too many alerts
- Don't ignore false positives
- Don't skip testing

## Related Rules

- Performance Monitoring: `.cursor/skills/performance-monitoring/SKILL.md`
