import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { useConversations } from "./use-conversations";

const mockList = vi.fn();
const mockCreate = vi.fn();
const mockRename = vi.fn();
const mockDelete = vi.fn();

vi.mock("@repo/services", () => ({
  chatListConversations: (...args: unknown[]) => mockList(...args),
  chatCreateConversation: (...args: unknown[]) => mockCreate(...args),
  chatRenameConversation: (...args: unknown[]) => mockRename(...args),
  chatDeleteConversation: (...args: unknown[]) => mockDelete(...args),
}));

function dto(overrides: { id?: string; title?: string; updatedAt?: string } = {}) {
  return {
    id: "conv_1",
    title: "新对话",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("useConversations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue([]);
  });

  describe("初始状态与列表拉取", () => {
    it("挂载时从后端拉取会话列表", async () => {
      mockList.mockResolvedValue([dto({ id: "conv_1", title: "会话1" }), dto({ id: "conv_2", title: "会话2" })]);

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.listLoading).toBe(false);
      });

      expect(mockList).toHaveBeenCalledTimes(1);
      expect(result.current.conversations).toHaveLength(2);
      expect(result.current.conversations[0].id).toBe("conv_1");
      expect(result.current.conversations[0].title).toBe("会话1");
    });

    it("拉取失败时列表为空并设置 listError", async () => {
      mockList.mockRejectedValue(new Error("网络错误"));

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.listLoading).toBe(false);
      });

      expect(result.current.conversations).toEqual([]);
      expect(result.current.listError).toBeInstanceOf(Error);
      expect((result.current.listError as Error).message).toBe("网络错误");
    });
  });

  describe("createConversation", () => {
    it("应调用后端创建并返回 id，并更新本地列表", async () => {
      mockList.mockResolvedValue([]);
      mockCreate.mockResolvedValue(dto({ id: "conv_new", title: "新对话" }));

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.listLoading).toBe(false);
      });

      let newId: string | null = null;
      await act(async () => {
        newId = await result.current.createConversation();
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(newId).toBe("conv_new");
      expect(result.current.conversations).toHaveLength(1);
      expect(result.current.conversations[0].id).toBe("conv_new");
      expect(result.current.conversations[0].title).toBe("新对话");
      expect(result.current.activeId).toBe("conv_new");
    });
  });

  describe("deleteConversation", () => {
    it("应调用后端删除并更新本地列表", async () => {
      mockList.mockResolvedValue([dto({ id: "conv_1" }), dto({ id: "conv_2" })]);
      mockDelete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.listLoading).toBe(false);
      });
      expect(result.current.conversations).toHaveLength(2);

      await act(async () => {
        await result.current.deleteConversation("conv_1");
      });

      expect(mockDelete).toHaveBeenCalledWith("conv_1");
      expect(result.current.conversations).toHaveLength(1);
      expect(result.current.conversations[0].id).toBe("conv_2");
    });

    it("删除当前激活会话时应清空 activeId", async () => {
      mockList.mockResolvedValue([dto({ id: "conv_1" })]);
      mockDelete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.listLoading).toBe(false);
      });

      await act(async () => {
        result.current.setActiveId("conv_1");
      });
      expect(result.current.activeId).toBe("conv_1");

      await act(async () => {
        await result.current.deleteConversation("conv_1");
      });

      expect(result.current.activeId).toBeNull();
    });
  });

  describe("updateConversationTitle", () => {
    it("应调用后端重命名并更新本地列表", async () => {
      mockList.mockResolvedValue([dto({ id: "conv_1", title: "新对话" })]);
      mockRename.mockResolvedValue(dto({ id: "conv_1", title: "我的第一个对话" }));

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.listLoading).toBe(false);
      });
      expect(result.current.conversations[0].title).toBe("新对话");

      await act(async () => {
        await result.current.updateConversationTitle("conv_1", "我的第一个对话");
      });

      expect(mockRename).toHaveBeenCalledWith("conv_1", "我的第一个对话");
      expect(result.current.conversations[0].title).toBe("我的第一个对话");
    });
  });

  describe("setActiveId", () => {
    it("应设置当前激活会话", async () => {
      mockList.mockResolvedValue([dto({ id: "conv_1" })]);
      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.listLoading).toBe(false);
      });

      await act(async () => {
        result.current.setActiveId("conv_1");
      });
      expect(result.current.activeId).toBe("conv_1");

      await act(async () => {
        result.current.setActiveId(null);
      });
      expect(result.current.activeId).toBeNull();
    });
  });
});
