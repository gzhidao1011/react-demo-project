import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { useConversations } from "./use-conversations";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
})

describe("useConversations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  describe("初始状态", () => {
    it("应该返回空会话列表", () => {
      const { result } = renderHook(() => useConversations())

      expect(result.current.conversations).toEqual([])
      expect(result.current.activeId).toBeNull()
    })

    it("应该从 localStorage 恢复会话列表", () => {
      const stored = [
        { id: "conv_1", title: "会话1", createdAt: 1000 },
        { id: "conv_2", title: "会话2", createdAt: 2000 },
      ]
      localStorageMock.setItem("chat_conversations", JSON.stringify(stored))

      const { result } = renderHook(() => useConversations())

      expect(result.current.conversations).toHaveLength(2)
      expect(result.current.conversations[0].id).toBe("conv_1")
      expect(result.current.conversations[0].title).toBe("会话1")
    })
  })

  describe("createConversation", () => {
    it("应该创建新会话并返回 id", () => {
      const { result } = renderHook(() => useConversations())

      let newId: string | null = null
      act(() => {
        newId = result.current.createConversation()
      })

      expect(newId).toBeTruthy()
      expect(typeof newId).toBe("string")
      expect(result.current.conversations).toHaveLength(1)
      expect(result.current.conversations[0].id).toBe(newId)
      expect(result.current.conversations[0].title).toBe("新对话")
      expect(result.current.activeId).toBe(newId)
    })

    it("应该持久化到 localStorage", () => {
      const { result } = renderHook(() => useConversations())

      act(() => {
        result.current.createConversation()
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "chat_conversations",
        expect.any(String),
      )
    })
  })

  describe("deleteConversation", () => {
    it("应该删除指定会话", () => {
      const { result } = renderHook(() => useConversations())

      let convId: string | null = null
      act(() => {
        convId = result.current.createConversation()
      })
      expect(result.current.conversations).toHaveLength(1)

      act(() => {
        result.current.deleteConversation(convId!)
      })

      expect(result.current.conversations).toHaveLength(0)
    })

    it("删除当前激活会话时应清空 activeId", () => {
      const { result } = renderHook(() => useConversations())

      let convId: string | null = null
      act(() => {
        convId = result.current.createConversation()
      })
      expect(result.current.activeId).toBe(convId)

      act(() => {
        result.current.deleteConversation(convId!)
      })

      expect(result.current.activeId).toBeNull()
    })
  })

  describe("setActiveId", () => {
    it("应该设置当前激活会话", () => {
      const { result } = renderHook(() => useConversations())

      let convId: string | null = null
      act(() => {
        convId = result.current.createConversation()
      })

      act(() => {
        result.current.setActiveId(null)
      })
      expect(result.current.activeId).toBeNull()

      act(() => {
        result.current.setActiveId(convId!)
      })
      expect(result.current.activeId).toBe(convId)
    })
  })

  describe("updateConversationTitle", () => {
    it("应该更新会话标题", () => {
      const { result } = renderHook(() => useConversations())

      let convId: string | null = null
      act(() => {
        convId = result.current.createConversation()
      })
      expect(result.current.conversations[0].title).toBe("新对话")

      act(() => {
        result.current.updateConversationTitle(convId!, "我的第一个对话")
      })

      expect(result.current.conversations[0].title).toBe("我的第一个对话")
    })
  })
})
