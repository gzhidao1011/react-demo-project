---
name: documentation-generation
description: Generate documentation automatically including API docs, code documentation, and README generation. Use when generating documentation or maintaining docs.
---

# Documentation Generation

Generate documentation automatically.

## Quick Checklist

When generating docs:

- [ ] **Doc generator** configured
- [ ] **Source** files documented
- [ ] **API docs** generated
- [ ] **README** updated
- [ ] **Docs** published

## API Documentation

### 1. Generate API Docs

```bash
# Generate OpenAPI spec
npx @redocly/cli bundle openapi.yaml -o dist/openapi.json

# Generate HTML docs
npx @redocly/cli build-docs openapi.yaml -o dist/docs
```

## Best Practices

### ✅ Good Practices

- Document as you code
- Generate automatically
- Keep docs updated
- Include examples
- Review regularly

### ❌ Anti-Patterns

- Don't skip documentation
- Don't generate outdated docs
- Don't ignore examples

## Related Rules

- Write Documentation: `.cursor/skills/write-documentation/SKILL.md`
