---
name: internationalization
description: Implement internationalization (i18n) including translation management, locale switching, and multi-language support. Use when adding i18n support or managing translations.
---

# Internationalization (i18n)

Implement internationalization following React i18n best practices.

## Quick Checklist

When implementing i18n:

- [ ] **i18n library** selected and configured
- [ ] **Translation files** organized by locale
- [ ] **Locale switching** implemented
- [ ] **Pluralization** handled
- [ ] **Date/number formatting** configured
- [ ] **Translation keys** extracted from code
- [ ] **Missing translations** handled

## Setup i18next

### 1. Install Dependencies

```bash
pnpm add i18next react-i18next i18next-browser-languagedetector
```

### 2. Configuration

```typescript
// packages/utils/src/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslations from "./locales/en.json";
import zhTranslations from "./locales/zh.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      zh: {
        translation: zhTranslations,
      },
    },
    fallbackLng: "zh",
    defaultNS: "translation",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
```

### 3. Translation Files

```json
// packages/utils/src/locales/zh.json
{
  "common": {
    "save": "保存",
    "cancel": "取消",
    "delete": "删除",
    "confirm": "确认"
  },
  "auth": {
    "login": "登录",
    "logout": "登出",
    "username": "用户名",
    "password": "密码"
  },
  "errors": {
    "required": "{{field}} 不能为空",
    "invalid": "{{field}} 格式不正确"
  }
}
```

```json
// packages/utils/src/locales/en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "confirm": "Confirm"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout",
    "username": "Username",
    "password": "Password"
  },
  "errors": {
    "required": "{{field}} is required",
    "invalid": "{{field}} is invalid"
  }
}
```

## Usage in Components

### 1. useTranslation Hook

```tsx
// apps/web/app/components/LoginForm.tsx
import { useTranslation } from "react-i18next";

export function LoginForm() {
  const { t } = useTranslation();

  return (
    <form>
      <label>{t("auth.username")}</label>
      <input type="text" />
      
      <label>{t("auth.password")}</label>
      <input type="password" />
      
      <button type="submit">{t("auth.login")}</button>
    </form>
  );
}
```

### 2. Translation with Variables

```tsx
const { t } = useTranslation();

// Simple variable
t("errors.required", { field: t("auth.username") });

// Nested keys
t("user.profile.name");
```

### 3. Pluralization

```json
{
  "items": {
    "one": "{{count}} item",
    "other": "{{count}} items"
  }
}
```

```tsx
const { t } = useTranslation();
t("items", { count: 1 }); // "1 item"
t("items", { count: 5 }); // "5 items"
```

## Locale Switching

### 1. Locale Switcher Component

```tsx
// apps/web/app/components/LocaleSwitcher.tsx
import { useTranslation } from "react-i18next";

const languages = [
  { code: "zh", name: "中文" },
  { code: "en", name: "English" },
];

export function LocaleSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <select
      value={i18n.language}
      onChange={(e) => changeLanguage(e.target.value)}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
```

### 2. Locale Hook

```tsx
// packages/hooks/src/useLocale.ts
import { useTranslation } from "react-i18next";

export function useLocale() {
  const { i18n, t } = useTranslation();

  return {
    locale: i18n.language,
    setLocale: (locale: string) => i18n.changeLanguage(locale),
    t,
    isRTL: i18n.dir() === "rtl",
  };
}
```

## Date and Number Formatting

### 1. Formatting Utilities

```typescript
// packages/utils/src/format.ts
import { format, formatDistance } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";

const locales = {
  zh: zhCN,
  en: enUS,
};

export function formatDate(
  date: Date | string,
  formatStr: string = "yyyy-MM-dd",
  locale: string = "zh"
): string {
  return format(new Date(date), formatStr, {
    locale: locales[locale as keyof typeof locales] || locales.zh,
  });
}

export function formatRelativeTime(
  date: Date | string,
  locale: string = "zh"
): string {
  return formatDistance(new Date(date), new Date(), {
    locale: locales[locale as keyof typeof locales] || locales.zh,
    addSuffix: true,
  });
}

export function formatNumber(
  value: number,
  locale: string = "zh",
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatCurrency(
  value: number,
  locale: string = "zh",
  currency: string = "CNY"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}
```

### 2. Usage

```tsx
import { formatDate, formatCurrency } from "@repo/utils";
import { useLocale } from "@repo/hooks";

export function ProductCard({ product }: { product: Product }) {
  const { locale } = useLocale();

  return (
    <div>
      <h3>{product.name}</h3>
      <p>{formatCurrency(product.price, locale)}</p>
      <p>{formatDate(product.createdAt, "PPP", locale)}</p>
    </div>
  );
}
```

## Translation Key Extraction

### 1. Extract Keys Script

```typescript
// scripts/extract-i18n-keys.ts
import { readFileSync, writeFileSync } from "fs";
import { glob } from "glob";

const translationKeys = new Set<string>();

// Find all translation calls
const files = glob.sync("apps/**/*.{ts,tsx}");

files.forEach((file) => {
  const content = readFileSync(file, "utf-8");
  
  // Match t("key") or t('key')
  const matches = content.matchAll(/t\(["']([^"']+)["']\)/g);
  
  matches.forEach((match) => {
    translationKeys.add(match[1]);
  });
});

// Generate missing keys report
const existingKeys = JSON.parse(
  readFileSync("packages/utils/src/locales/zh.json", "utf-8")
);

const missingKeys = Array.from(translationKeys).filter(
  (key) => !getNestedValue(existingKeys, key)
);

console.log("Missing translation keys:", missingKeys);
```

## Best Practices

### ✅ Good Practices

- Use namespaced translation keys
- Extract hardcoded strings
- Handle pluralization correctly
- Format dates/numbers by locale
- Provide fallback translations
- Cache translations
- Use TypeScript for type safety

### ❌ Anti-Patterns

- Don't hardcode strings in components
- Don't ignore missing translations
- Don't use generic keys
- Don't forget pluralization
- Don't skip date/number formatting

## Related Rules

- Code Style: `.cursor/rules/01-代码风格.mdc`
