---
name: api-documentation
description: Generate API documentation including OpenAPI/Swagger specs, API reference docs, and interactive API explorers. Use when documenting APIs or generating API specs.
---

# API Documentation

Generate comprehensive API documentation.

## Quick Checklist

When documenting APIs:

- [ ] **OpenAPI spec** generated
- [ ] **API endpoints** documented
- [ ] **Request/response** examples provided
- [ ] **Error codes** documented
- [ ] **Authentication** explained
- [ ] **Interactive explorer** set up
- [ ] **Versioning** documented

## OpenAPI Specification

### 1. Generate OpenAPI Spec

```typescript
// packages/services/src/openapi.ts
export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "API Documentation",
    version: "1.0.0",
    description: "API documentation for the application",
  },
  servers: [
    {
      url: "https://api.example.com",
      description: "Production server",
    },
  ],
  paths: {
    "/api/users": {
      get: {
        summary: "Get users",
        tags: ["Users"],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
        ],
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
        },
      },
    },
  },
};
```

## API Documentation Generator

### 1. Document API Endpoints

```typescript
// packages/services/src/api.service.base.ts
/**
 * Base API service class
 * 
 * @example
 * ```typescript
 * const service = new APIServiceBase();
 * const data = await service.request('/api/users');
 * ```
 */
export class APIServiceBase {
  /**
   * Make HTTP request
   * 
   * @param url - API endpoint URL
   * @param options - Request options
   * @returns Promise resolving to response data
   * 
   * @throws {Error} When request fails
   * 
   * @example
   * ```typescript
   * const users = await service.request('/api/users', {
   *   method: 'GET',
   * });
   * ```
   */
  protected async request<T>(url: string, options?: RequestInit): Promise<T> {
    // Implementation
  }
}
```

## Best Practices

### ✅ Good Practices

- Document all endpoints
- Provide request/response examples
- Include error responses
- Document authentication
- Use OpenAPI standard
- Keep docs up to date
- Provide interactive explorer

### ❌ Anti-Patterns

- Don't skip endpoint documentation
- Don't use outdated examples
- Don't ignore error cases
- Don't skip authentication docs

## Related Rules

- API Structure: `.cursor/rules/06-API结构.mdc`
- Write Documentation: `.cursor/skills/write-documentation/SKILL.md`
