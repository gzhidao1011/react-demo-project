---
name: oauth-integration
description: Implement OAuth integration including social login (Google, GitHub, etc.), third-party authentication, and OAuth flow management. Use when integrating OAuth providers or social login.
---

# OAuth Integration

Implement OAuth integration for social login and third-party authentication.

## Quick Checklist

When implementing OAuth:

- [ ] **OAuth provider** selected and configured
- [ ] **Client ID/Secret** configured
- [ ] **Redirect URI** configured
- [ ] **OAuth flow** implemented
- [ ] **Token handling** implemented
- [ ] **Error handling** added
- [ ] **User data** mapped correctly

## Google OAuth

### 1. Install Google OAuth Library

```bash
pnpm add @react-oauth/google
```

### 2. Google OAuth Provider

```tsx
// apps/web/app/providers/GoogleOAuthProvider.tsx
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || "";

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}
```

### 3. Google Login Component

```tsx
// apps/web/app/components/GoogleLogin.tsx
import { useGoogleLogin } from "@react-oauth/google";
import { authService } from "@repo/services";

export function GoogleLoginButton() {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Send token to backend
        const response = await authService.loginWithGoogle({
          accessToken: tokenResponse.access_token,
        });

        // Handle response (save tokens, redirect, etc.)
        console.log("Login successful:", response);
      } catch (error) {
        console.error("Google login failed:", error);
      }
    },
    onError: () => {
      console.error("Google login failed");
    },
  });

  return (
    <button onClick={() => login()} className="google-login-button">
      使用 Google 登录
    </button>
  );
}
```

## GitHub OAuth

### 1. GitHub OAuth Flow

```tsx
// apps/web/app/components/GitHubLogin.tsx
export function GitHubLoginButton() {
  const handleGitHubLogin = () => {
    const clientId = process.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/auth/github/callback`
    );
    const scope = "user:email";
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    
    window.location.href = authUrl;
  };

  return (
    <button onClick={handleGitHubLogin} className="github-login-button">
      使用 GitHub 登录
    </button>
  );
}
```

### 2. GitHub Callback Handler

```tsx
// apps/web/app/routes/auth/github/callback.tsx
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { authService } from "@repo/services";

export function GitHubCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("code");

  useEffect(() => {
    if (code) {
      authService
        .loginWithGitHub({ code })
        .then(() => {
          navigate("/dashboard");
        })
        .catch((error) => {
          console.error("GitHub login failed:", error);
          navigate("/sign-in?error=github_login_failed");
        });
    }
  }, [code, navigate]);

  return <div>处理 GitHub 登录...</div>;
}
```

## OAuth Service

### 1. OAuth Service Implementation

```typescript
// packages/services/src/auth.service.ts
export class AuthService extends APIServiceBase {
  async loginWithGoogle(data: { accessToken: string }): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>("/api/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    // Save tokens
    saveTokens(response);
    return response;
  }

  async loginWithGitHub(data: { code: string }): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>("/api/auth/github", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    // Save tokens
    saveTokens(response);
    return response;
  }
}
```

## OAuth Hook

### 1. useOAuth Hook

```tsx
// packages/hooks/src/useOAuth.ts
import { useState, useCallback } from "react";
import { authService } from "@repo/services";

type OAuthProvider = "google" | "github";

export function useOAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loginWithProvider = useCallback(
    async (provider: OAuthProvider, data: unknown) => {
      try {
        setLoading(true);
        setError(null);

        let response;
        switch (provider) {
          case "google":
            response = await authService.loginWithGoogle(data as { accessToken: string });
            break;
          case "github":
            response = await authService.loginWithGitHub(data as { code: string });
            break;
          default:
            throw new Error(`Unsupported provider: ${provider}`);
        }

        return response;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loginWithProvider,
    loading,
    error,
  };
}
```

## Best Practices

### ✅ Good Practices

- Store client IDs in environment variables
- Handle OAuth errors gracefully
- Validate tokens on backend
- Map user data correctly
- Handle token expiration
- Provide clear error messages
- Support multiple providers

### ❌ Anti-Patterns

- Don't expose client secrets
- Don't skip token validation
- Don't ignore OAuth errors
- Don't store tokens insecurely
- Don't skip user data mapping

## Related Rules

- Authentication: `.cursor/skills/authentication-authorization/SKILL.md`
- Security: `.cursor/rules/21-安全规范.mdc`
