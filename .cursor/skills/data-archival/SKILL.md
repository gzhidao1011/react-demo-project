---
name: data-archival
description: Implement data archival including cold storage, data compression, and archival retrieval. Use when archiving data or implementing archival systems.
---

# Data Archival

Implement data archival systems.

## Quick Checklist

When archiving data:

- [ ] **Archival** strategy defined
- [ ] **Storage** selected
- [ ] **Compression** applied
- [ ] **Indexing** configured
- [ ] **Retrieval** tested

## Archival Implementation

### 1. Archive Data

```typescript
async function archiveData(data: unknown[], archivePath: string) {
  // Compress data
  const compressed = compress(data);
  
  // Upload to cold storage
  await uploadToS3(compressed, archivePath);
  
  // Update index
  await updateArchiveIndex(archivePath, {
    date: new Date(),
    size: compressed.length,
    recordCount: data.length,
  });
}
```

## Best Practices

### ✅ Good Practices

- Use cold storage
- Compress data
- Index archives
- Test retrieval
- Monitor costs

### ❌ Anti-Patterns

- Don't skip compression
- Don't ignore indexing
- Don't skip testing

## Related Rules

- Data Retention: `.cursor/skills/data-retention/SKILL.md`
