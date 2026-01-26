import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  setTokenExpires,
  isTokenExpired,
  saveTokens,
  clearTokens,
  isAuthenticated,
  getRememberMe,
  type LoginResponse,
} from "./auth"

// Mock localStorage 和 sessionStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

const sessionStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

// 设置全局 mock（使用 vi.stubGlobal 在 Node.js 环境中）
vi.stubGlobal("localStorage", localStorageMock)
vi.stubGlobal("sessionStorage", sessionStorageMock)

describe("auth", () => {
  beforeEach(() => {
    // 每个测试前清除所有存储
    localStorageMock.clear()
    sessionStorageMock.clear()
    // 清除内存中的 token（通过重新导入模块或直接调用 clearTokens）
    clearTokens()
  })

  describe("getAccessToken", () => {
    it("应该从内存中获取 token（如果存在）", () => {
      setAccessToken("memory-token")
      expect(getAccessToken()).toBe("memory-token")
    })

    it("应该从 sessionStorage 获取 token（当未设置记住我时）", () => {
      sessionStorageMock.setItem("access_token", "session-token")
      expect(getAccessToken()).toBe("session-token")
    })

    it("应该从 localStorage 获取 token（当设置了记住我时）", () => {
      localStorageMock.setItem("remember_me", "true")
      localStorageMock.setItem("access_token", "local-token")
      expect(getAccessToken()).toBe("local-token")
    })

    it("应该返回 null（当 token 不存在时）", () => {
      expect(getAccessToken()).toBeNull()
    })

    it("应该优先返回内存中的 token", () => {
      setAccessToken("memory-token")
      sessionStorageMock.setItem("access_token", "session-token")
      expect(getAccessToken()).toBe("memory-token")
    })
  })

  describe("setAccessToken", () => {
    it("应该将 token 保存到内存和 sessionStorage（默认）", () => {
      setAccessToken("test-token")
      expect(getAccessToken()).toBe("test-token")
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith("access_token", "test-token")
    })

    it("应该将 token 保存到内存和 localStorage（当 rememberMe 为 true）", () => {
      setAccessToken("test-token", true)
      expect(getAccessToken()).toBe("test-token")
      expect(localStorageMock.setItem).toHaveBeenCalledWith("access_token", "test-token")
      expect(localStorageMock.setItem).toHaveBeenCalledWith("remember_me", "true")
    })

    it("应该清除记住我选项（当 rememberMe 为 false）", () => {
      localStorageMock.setItem("remember_me", "true")
      setAccessToken("test-token", false)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("remember_me")
    })
  })

  describe("getRefreshToken", () => {
    it("应该从 sessionStorage 获取 refresh token（默认）", () => {
      sessionStorageMock.setItem("refresh_token", "refresh-token")
      expect(getRefreshToken()).toBe("refresh-token")
    })

    it("应该从 localStorage 获取 refresh token（当设置了记住我时）", () => {
      localStorageMock.setItem("remember_me", "true")
      localStorageMock.setItem("refresh_token", "refresh-token")
      expect(getRefreshToken()).toBe("refresh-token")
    })

    it("应该返回 null（当 refresh token 不存在时）", () => {
      expect(getRefreshToken()).toBeNull()
    })
  })

  describe("setRefreshToken", () => {
    it("应该将 refresh token 保存到 sessionStorage（默认）", () => {
      setRefreshToken("refresh-token")
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith("refresh_token", "refresh-token")
    })

    it("应该将 refresh token 保存到 localStorage（当 rememberMe 为 true）", () => {
      setRefreshToken("refresh-token", true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith("refresh_token", "refresh-token")
    })
  })

  describe("setTokenExpires", () => {
    it("应该设置 token 过期时间到 sessionStorage（默认）", () => {
      const expiresIn = 3600 // 1 小时
      const beforeTime = Date.now()
      setTokenExpires(expiresIn)
      const afterTime = Date.now()

      expect(sessionStorageMock.setItem).toHaveBeenCalled()
      // 获取最后一次调用（因为可能有其他调用）
      const calls = (sessionStorageMock.setItem as ReturnType<typeof vi.fn>).mock.calls
      const lastCall = calls[calls.length - 1]
      expect(lastCall[0]).toBe("token_expires")
      const expiresAt = parseInt(lastCall[1])
      expect(expiresAt).toBeGreaterThanOrEqual(beforeTime + expiresIn * 1000)
      expect(expiresAt).toBeLessThanOrEqual(afterTime + expiresIn * 1000)
    })

    it("应该设置 token 过期时间到 localStorage（当 rememberMe 为 true）", () => {
      const expiresIn = 3600
      setTokenExpires(expiresIn, true)
      expect(localStorageMock.setItem).toHaveBeenCalled()
      // 获取最后一次调用
      const calls = (localStorageMock.setItem as ReturnType<typeof vi.fn>).mock.calls
      const lastCall = calls[calls.length - 1]
      expect(lastCall[0]).toBe("token_expires")
    })
  })

  describe("isTokenExpired", () => {
    it("应该返回 true（当过期时间不存在时）", () => {
      expect(isTokenExpired()).toBe(true)
    })

    it("应该返回 false（当 token 未过期时）", () => {
      const expiresIn = 3600 // 1 小时
      setTokenExpires(expiresIn)
      expect(isTokenExpired()).toBe(false)
    })

    it("应该返回 true（当 token 已过期时）", () => {
      const expiresAt = Date.now() - 1000 // 1 秒前过期
      sessionStorageMock.setItem("token_expires", expiresAt.toString())
      expect(isTokenExpired()).toBe(true)
    })

    it("应该提前 60 秒判断为过期", () => {
      const expiresAt = Date.now() + 30000 // 30 秒后过期
      sessionStorageMock.setItem("token_expires", expiresAt.toString())
      // 提前 60 秒判断，所以 30 秒后应该被判断为过期
      expect(isTokenExpired()).toBe(true)
    })

    it("应该从 localStorage 检查过期时间（当设置了记住我时）", () => {
      localStorageMock.setItem("remember_me", "true")
      const expiresIn = 3600
      setTokenExpires(expiresIn, true)
      expect(isTokenExpired()).toBe(false)
    })
  })

  describe("saveTokens", () => {
    it("应该保存所有 token（使用 accessToken）", () => {
      const response: LoginResponse = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 3600,
      }

      saveTokens(response)

      expect(getAccessToken()).toBe("access-token")
      expect(getRefreshToken()).toBe("refresh-token")
      expect(isTokenExpired()).toBe(false)
    })

    it("应该保存所有 token（使用 token 字段，兼容格式）", () => {
      const response: LoginResponse = {
        token: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 3600,
      }

      saveTokens(response)

      expect(getAccessToken()).toBe("access-token")
      expect(getRefreshToken()).toBe("refresh-token")
    })

    it("应该使用默认过期时间（当 expiresIn 不存在时）", () => {
      const response: LoginResponse = {
        accessToken: "access-token",
      }

      saveTokens(response)

      expect(isTokenExpired()).toBe(false)
    })

    it("应该保存到 localStorage（当 rememberMe 为 true）", () => {
      const response: LoginResponse = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 3600,
      }

      saveTokens(response, true)

      expect(localStorageMock.setItem).toHaveBeenCalledWith("access_token", "access-token")
      expect(localStorageMock.setItem).toHaveBeenCalledWith("refresh_token", "refresh-token")
      expect(localStorageMock.setItem).toHaveBeenCalledWith("remember_me", "true")
    })

    it("应该只保存存在的 token", () => {
      const response: LoginResponse = {
        accessToken: "access-token",
        // 没有 refreshToken
      }

      saveTokens(response)

      expect(getAccessToken()).toBe("access-token")
      expect(getRefreshToken()).toBeNull()
    })
  })

  describe("clearTokens", () => {
    it("应该清除所有 token 和存储", () => {
      setAccessToken("token", true)
      setRefreshToken("refresh-token", true)
      setTokenExpires(3600, true)

      clearTokens()

      expect(getAccessToken()).toBeNull()
      expect(getRefreshToken()).toBeNull()
      expect(isTokenExpired()).toBe(true)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("access_token")
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("refresh_token")
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("token_expires")
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("remember_me")
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith("access_token")
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith("refresh_token")
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith("token_expires")
    })

    it("应该清除内存中的 token", () => {
      setAccessToken("memory-token")
      expect(getAccessToken()).toBe("memory-token")

      clearTokens()

      expect(getAccessToken()).toBeNull()
    })
  })

  describe("isAuthenticated", () => {
    it("应该返回 false（当 token 不存在时）", () => {
      expect(isAuthenticated()).toBe(false)
    })

    it("应该返回 false（当 token 已过期时）", () => {
      setAccessToken("token")
      const expiresAt = Date.now() - 1000
      sessionStorageMock.setItem("token_expires", expiresAt.toString())
      expect(isAuthenticated()).toBe(false)
    })

    it("应该返回 true（当 token 存在且未过期时）", () => {
      setAccessToken("token")
      setTokenExpires(3600)
      expect(isAuthenticated()).toBe(true)
    })

    it("应该返回 false（当 token 存在但即将过期时）", () => {
      setAccessToken("token")
      const expiresAt = Date.now() + 30000 // 30 秒后过期，但提前 60 秒判断
      sessionStorageMock.setItem("token_expires", expiresAt.toString())
      expect(isAuthenticated()).toBe(false)
    })
  })

  describe("getRememberMe", () => {
    it("应该返回 false（当未设置记住我时）", () => {
      expect(getRememberMe()).toBe(false)
    })

    it("应该返回 true（当设置了记住我时）", () => {
      localStorageMock.setItem("remember_me", "true")
      expect(getRememberMe()).toBe(true)
    })

    it("应该返回 false（当记住我选项为其他值时）", () => {
      localStorageMock.setItem("remember_me", "false")
      expect(getRememberMe()).toBe(false)
    })
  })

  describe("存储方式切换", () => {
    it("应该根据记住我选项切换存储方式", () => {
      // 初始使用 sessionStorage
      setAccessToken("session-token")
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith("access_token", "session-token")

      // 切换到 localStorage
      setAccessToken("local-token", true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith("access_token", "local-token")

      // 切换回 sessionStorage
      setAccessToken("session-token-2", false)
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith("access_token", "session-token-2")
    })

    it("应该在切换存储方式时正确读取 token", () => {
      // 设置到 sessionStorage
      setAccessToken("session-token", false)
      expect(getAccessToken()).toBe("session-token")

      // 清除并设置到 localStorage
      clearTokens()
      setAccessToken("local-token", true)
      expect(getAccessToken()).toBe("local-token")
    })
  })
})
