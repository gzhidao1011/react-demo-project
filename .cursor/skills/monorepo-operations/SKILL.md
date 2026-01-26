---
name: monorepo-operations
description: Handle monorepo-specific tasks like building packages, managing dependencies, and working with Turborepo. Use when working with monorepo structure, building packages, or managing workspace dependencies.
---

# Monorepo Operations

Handle monorepo-specific tasks using Turborepo and pnpm workspace.

## Project Structure

```
apps/
  ├── web/              # Main web app
  ├── docs/             # Documentation site
  └── storybook/        # Storybook app

packages/
  ├── ui/               # UI components (@repo/ui)
  ├── utils/            # Utilities (@repo/utils)
  ├── request/          # API client (@repo/request)
  └── ...
```

## Common Commands

### Build

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @repo/ui build

# Build package and dependencies
pnpm --filter @repo/ui... build
```

### Development

```bash
# Run dev for all apps
pnpm dev

# Run dev for specific app
pnpm --filter @repo/web dev

# Run dev with dependencies
pnpm --filter @repo/web... dev
```

### Testing

```bash
# Test all packages
pnpm test

# Test specific package
pnpm --filter @repo/utils test

# Test with dependencies
pnpm --filter @repo/utils... test
```

### Code Quality

```bash
# Check all
pnpm check

# Check specific package
pnpm --filter @repo/ui check

# Fix issues
pnpm fix
```

## Package Management

### Adding Dependencies

```bash
# Add to root (dev dependency)
pnpm add -Dw <package>

# Add to specific package
pnpm --filter @repo/ui add <package>

# Add workspace package
pnpm --filter @repo/web add @repo/ui
```

### Removing Dependencies

```bash
# Remove from specific package
pnpm --filter @repo/ui remove <package>
```

## Turborepo Tasks

### Available Tasks

- `build` - Build packages
- `dev` - Development mode
- `test` - Run tests
- `check` - Type check, lint, format
- `check:types` - TypeScript type checking
- `check:lint` - Linting
- `check:format` - Format checking
- `fix` - Auto-fix issues
- `clean` - Clean build artifacts

### Task Dependencies

Tasks automatically handle dependencies:
- `build` depends on `^build` (build dependencies first)
- `dev` depends on `^build` (build dependencies first)
- `test` has no dependencies (can run independently)

## Creating New Package

1. **Create directory**: `packages/new-package/`
2. **Create package.json**:
```json
{
  "name": "@repo/new-package",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```
3. **Add to workspace**: Already included via `pnpm-workspace.yaml`
4. **Build configuration**: Add to `turbo.json` if needed

## Cross-Package Imports

Use workspace protocol:

```typescript
// ✅ Correct
import { Button } from "@repo/ui";
import { useAuth } from "@repo/utils";

// ❌ Wrong
import { Button } from "../../packages/ui";
```

## Cache Management

Turborepo caches build outputs:

```bash
# Clear cache
pnpm clean

# Cache location
.turbo/
```

## Common Issues

### Build Fails

1. Check package dependencies
2. Verify `turbo.json` configuration
3. Clear cache: `pnpm clean`
4. Rebuild dependencies: `pnpm --filter @repo/utils build`

### Import Errors

1. Verify package name in `package.json`
2. Check `tsconfig.json` paths
3. Ensure package is built
4. Check workspace configuration

## Related Rules

- Project Structure: `.cursor/rules/02-项目结构.mdc`
- Code Organization: `.cursor/rules/05-代码组织.mdc`
