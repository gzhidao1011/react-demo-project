---
name: data-encryption
description: Implement data encryption including encryption at rest, encryption in transit, and key management. Use when securing sensitive data or implementing encryption.
---

# Data Encryption

Implement data encryption.

## Quick Checklist

When implementing encryption:

- [ ] **Encryption** algorithm selected
- [ ] **Key management** configured
- [ ] **Encryption at rest** implemented
- [ ] **Encryption in transit** enabled
- [ ] **Key rotation** planned

## Encryption Implementation

### 1. Data Encryption

```typescript
import crypto from "crypto";

const algorithm = "aes-256-gcm";
const key = process.env.ENCRYPTION_KEY!;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, "hex"), iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, "hex"), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
```

## Best Practices

### ✅ Good Practices

- Encrypt sensitive data
- Use strong algorithms
- Manage keys securely
- Rotate keys regularly
- Use HTTPS for transit

### ❌ Anti-Patterns

- Don't store keys in code
- Don't use weak algorithms
- Don't skip key rotation

## Related Rules

- Security: `.cursor/rules/21-安全规范.mdc`
